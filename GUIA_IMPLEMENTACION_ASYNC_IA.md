# Guia de Implementacion Async para Analisis IA

## Objetivo

Esta guia aterriza el documento funcional al backend actual en NestJS para implementar las partes pesadas de forma asincrona, especialmente:

- analisis visual por IA
- procesamiento de imagenes
- eventos de dominio asociados
- preparacion para recepcion de emails y notificaciones async

La prioridad recomendada para este repo es implementar primero el flujo async de inspeccion IA, porque:

1. el documento funcional lo exige
2. el schema Prisma ya tiene `Inspection`, `Finding`, `Evidence`, `CanonicalEvent`, `AgentAction` y `SystemQuestion`
3. hoy el backend no tiene colas, modulo IA ni endpoints de inspeccion

---

## Estado Actual del Repo

### Ya existe

- `src/modules/wash-orders`
- `src/modules/evidence`
- `src/modules/assignments`
- `prisma/schema.prisma` con entidades ricas para inspecciones y eventos
- subida de evidencias a Supabase Storage

### Aun no existe

- Redis y colas
- modulo `inspections`
- modulo `ai`
- persistencia especifica para ejecuciones async de IA
- endpoint `POST /inspections/:id/analyze`
- endpoint `GET /inspections/:id/result`
- workflow de certificacion humana final

### Brecha importante con el documento funcional

El documento usa estados como:

- `PENDING_APPROVAL`
- `APPROVED`
- `PRE_INSPECTION`
- `IA_REVIEW`
- `PENDING_CERTIFICATION`

Pero el enum actual `WashOrderStatus` usa:

- `PENDING`
- `SCHEDULED`
- `ASSIGNED`
- `IN_PROGRESS`
- `PNEUMATIC_TEST`
- `WAITING_QI`
- `COMPLETED`
- `BLOCKED`
- `REJECTED`
- `CANCELLED`

Antes de implementar el flujo IA hay que decidir una de estas dos rutas:

### Ruta recomendada

Extender `WashOrderStatus` para alinearlo al documento funcional.

### Ruta temporal

Mapear estados funcionales sobre los actuales:

- `PENDING_APPROVAL` -> `PENDING`
- `APPROVED` -> `SCHEDULED`
- `PRE_INSPECTION` -> `WAITING_QI`
- `IA_REVIEW` -> `BLOCKED` o un estado nuevo
- `PENDING_CERTIFICATION` -> `WAITING_QI` con bandera adicional

No recomiendo esta segunda ruta para largo plazo porque vuelve opaco el workflow.

---

## Alcance Recomendado de la Primera Implementacion

Implementar este flujo:

1. el operario carga evidencias
2. el coordinador o inspector solicita analisis IA
3. la API crea una ejecucion async
4. la cola procesa imagenes en background
5. se guarda el resultado estructurado
6. se crean hallazgos si aplica
7. la orden pasa a revision humana final

No hacer todavia:

- autoaprobacion final por IA
- procesamiento de email IMAP
- notificaciones multicanal
- reglas EFTCO e ITCO completamente automatizadas

---

## Dependencias a Instalar

Agregar estas dependencias:

```bash
npm install @nestjs/bullmq bullmq ioredis openai
```

Si luego quieres observabilidad:

```bash
npm install nestjs-pino pino pino-pretty
```

---

## Variables de Entorno Nuevas

Agregar al `.env.example` y al `ConfigModule`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_VISION_MODEL=gpt-4.1-mini
AI_MAX_IMAGES_PER_JOB=12
AI_MIN_IMAGES_REQUIRED=3
AI_TIMEOUT_MS=120000
AI_MAX_RETRIES=3
AI_RETRY_BACKOFF_MS=5000
```

Tambien actualiza `src/app.module.ts` para validar esas variables con Joi.

---

## Cambios de Base de Datos Recomendados

### 1. Crear una tabla especifica para ejecuciones de IA

Aunque existe `AgentAction`, para este caso conviene una tabla dedicada porque necesitas:

- estado del job
- reintentos
- timestamps de cola
- score
- clasificacion
- respuesta cruda del proveedor
- consulta rapida por inspeccion

### Modelo sugerido

Agregar en `prisma/schema.prisma`:

```prisma
model AiInspectionRun {
  id                String                @id @default(cuid())
  inspectionId      String
  inspection        Inspection            @relation(fields: [inspectionId], references: [id])
  washOrderId       String
  washOrder         WashOrder             @relation(fields: [washOrderId], references: [id])
  requestedById     String
  requestedBy       User                  @relation(fields: [requestedById], references: [id])
  status            AiInspectionRunStatus @default(QUEUED)

  provider          String                @default("openai")
  model             String?
  score             Int?
  classification    AiClassification?
  summary           String?
  findingsJson      Json?
  rawResponse       Json?
  errorMessage      String?
  evidenceCount     Int                   @default(0)
  attempts          Int                   @default(0)
  correlationId     String?

  queuedAt          DateTime              @default(now())
  startedAt         DateTime?
  finishedAt        DateTime?
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  @@index([inspectionId, createdAt])
  @@index([washOrderId, createdAt])
  @@map("ai_inspection_runs")
}

enum AiInspectionRunStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum AiClassification {
  APPROVED
  MANUAL_REVIEW
  REJECTED
}
```

### 2. Relacionar `Inspection` con la corrida IA

Agregar:

```prisma
aiRuns AiInspectionRun[]
```

### 3. Considerar extender `WashOrderStatus`

Recomendado agregar:

```prisma
PRE_INSPECTION
IA_REVIEW
PENDING_CERTIFICATION
```

Si no quieres tocar el enum todavia, usa `WAITING_QI` como estado previo y una bandera en la respuesta del endpoint, pero eso solo como paso temporal.

### 4. Evaluar eventos canónicos

El enum `EventType` actual no incluye eventos de IA. Agrega al menos:

```prisma
INSPECTION_AI_QUEUED
INSPECTION_AI_STARTED
INSPECTION_AI_COMPLETED
INSPECTION_AI_FAILED
INSPECTION_CERTIFICATION_REQUESTED
```

---

## Estructura de Modulos Recomendada

Crear estos modulos:

```text
src/modules/inspections/
  inspections.module.ts
  inspections.controller.ts
  inspections.service.ts
  dto/
    request-ai-analysis.dto.ts
    certify-inspection.dto.ts

src/modules/ai/
  ai.module.ts
  ai.service.ts
  ai.processor.ts
  ai.queue.ts
  prompts/
    tank-inspection.prompt.ts
  mappers/
    ai-result.mapper.ts
  interfaces/
    ai-inspection-result.interface.ts

src/modules/events/
  events.module.ts
  events.service.ts
```

Si quieres mantenerlo minimo, `events` puede esperar y los eventos se crean desde `inspections.service.ts`.

---

## Responsabilidades por Servicio

### `InspectionsService`

Debe encargarse de:

- validar que la orden existe
- validar que hay suficientes evidencias
- crear o reutilizar la inspeccion
- crear la corrida `AiInspectionRun`
- cambiar el estado de la orden a `IA_REVIEW`
- registrar `CanonicalEvent`
- encolar el job
- exponer el resultado agregado

### `AiService`

Debe encargarse de:

- construir el prompt
- preparar imagenes y contexto
- llamar OpenAI
- normalizar la respuesta
- traducir la salida IA a estructura de negocio

### `AiProcessor`

Debe encargarse de:

- consumir la cola
- marcar estados `PROCESSING`, `COMPLETED` o `FAILED`
- persistir hallazgos
- actualizar la orden para certificacion humana
- registrar eventos y preguntas al humano si aplica

---

## Funciones que Debes Implementar

Estas son las funciones clave. Puedes usarlas casi con esos nombres.

### 1. Solicitar analisis async

Archivo sugerido: `src/modules/inspections/inspections.service.ts`

```ts
async requestAiAnalysis(
  inspectionId: string,
  requestedById: string,
): Promise<{
  inspectionId: string;
  aiRunId: string;
  status: 'QUEUED';
}>
```

#### Responsabilidades

- cargar inspeccion con orden y evidencias
- validar minimo de imagenes
- validar que no exista una corrida activa para la misma inspeccion
- crear `AiInspectionRun`
- mover la orden a `IA_REVIEW`
- registrar evento `INSPECTION_AI_QUEUED`
- enviar job a Redis

#### Reglas

- si hay un job `QUEUED` o `PROCESSING` para esa inspeccion, responder conflicto
- si no hay evidencias suficientes, responder `400`
- si la orden no esta en etapa valida, responder `400`

---

### 2. Obtener resultado de analisis

Archivo sugerido: `src/modules/inspections/inspections.service.ts`

```ts
async getAiAnalysisResult(inspectionId: string): Promise<{
  inspectionId: string;
  latestRun: AiInspectionRun;
  findings: Finding[];
  orderStatus: string;
}>
```

#### Debe devolver

- ultima corrida IA
- score
- clasificacion
- resumen
- hallazgos asociados
- estado actual de la orden

---

### 3. Procesar job de inspeccion IA

Archivo sugerido: `src/modules/ai/ai.processor.ts`

```ts
async handleInspectionAnalysisJob(
  job: Job<{ aiRunId: string }>
): Promise<void>
```

#### Flujo interno

1. cargar `AiInspectionRun`
2. marcar `PROCESSING`
3. cargar inspeccion, orden, tanque y evidencias
4. llamar `AiService.analyzeInspection(...)`
5. persistir resultado
6. crear `Finding` cuando aplique
7. actualizar orden a `PENDING_CERTIFICATION`
8. registrar `INSPECTION_AI_COMPLETED`

#### En error

- incrementar `attempts`
- guardar `errorMessage`
- si supera maximo de reintentos, marcar `FAILED`
- registrar `INSPECTION_AI_FAILED`

---

### 4. Ejecutar el analisis con OpenAI

Archivo sugerido: `src/modules/ai/ai.service.ts`

```ts
async analyzeInspection(input: {
  inspectionId: string;
  washOrderId: string;
  tank: {
    id: string;
    serialNumber: string;
    isoCode?: string | null;
  };
  evidence: Array<{
    id: string;
    fileUrl: string;
    type: string;
    comment?: string | null;
  }>;
  operationContext?: {
    serviceType?: string | null;
    notes?: string | null;
  };
}): Promise<{
  score: number;
  classification: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
  summary: string;
  findings: Array<{
    itcoZoneCode?: string;
    eftcoDamageCode?: string;
    eftcoDamageName?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    location: string;
    evidenceIds: string[];
  }>;
  risks: string[];
  recommendation: string;
  rawResponse: unknown;
}>
```

#### Recomendaciones

- exigir salida JSON estricta
- limitar numero de imagenes por corrida
- enviar solo evidencias relevantes
- incluir instrucciones de "IA asistiva" y no "decision final"

---

### 5. Persistir hallazgos estructurados

Archivo sugerido: `src/modules/ai/mappers/ai-result.mapper.ts` o dentro del processor

```ts
async persistAiFindings(
  inspectionId: string,
  washOrderId: string,
  inspectorId: string,
  findings: NormalizedAiFinding[],
): Promise<void>
```

#### Debe hacer

- crear registros en `Finding`
- asociar `tankId`, `washOrderId`, `inspectionId`
- mapear severidad
- guardar zona ITCO si la IA la devolvio
- enlazar evidencias relacionadas cuando sea posible

Si la IA no puede identificar con confianza la zona o codigo, guarda descripcion libre y crea `SystemQuestion` para revision humana.

---

### 6. Certificacion humana final

Archivo sugerido: `src/modules/inspections/inspections.service.ts`

```ts
async certifyInspection(
  inspectionId: string,
  reviewerId: string,
  dto: {
    approved: boolean;
    notes?: string;
  },
): Promise<void>
```

#### Reglas

- la IA nunca deja la orden en `COMPLETED` por si sola
- si el humano aprueba, mover a `COMPLETED`
- si el humano rechaza, mover a `BLOCKED` o `REJECTED` segun tu regla de negocio
- registrar `AgentAction` o `CanonicalEvent`

---

## Contrato del Job de Cola

El payload del job debe ser minimo:

```ts
type AiInspectionJob = {
  aiRunId: string;
  correlationId: string;
};
```

No mandes todas las imagenes dentro del job. Solo manda IDs. El processor debe volver a consultar la base de datos.

---

## Cola Recomendada

### Nombre de cola

```ts
export const AI_INSPECTION_QUEUE = 'ai-inspection';
```

### Tipos de job

```ts
export const AI_INSPECTION_ANALYZE_JOB = 'analyze-inspection';
```

### Configuracion sugerida

- `attempts`: 3
- `backoff`: exponencial
- `removeOnComplete`: true
- `removeOnFail`: false
- `concurrency`: 2 al inicio

---

## Flujo End-to-End Recomendado

### Paso 1. Carga de evidencia

El flujo actual de `EvidenceService.upload(...)` puede quedarse, pero agrega validaciones:

- tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- minimo de imagenes para preinspeccion
- tamaño maximo
- hash opcional para integridad

### Paso 2. Crear o localizar inspeccion

Cuando el usuario solicite analisis IA:

- si ya existe una inspeccion abierta para la orden, reutilizarla
- si no existe, crear `Inspection` con tipo `INTERNAL` o `PRE_DISPATCH` segun el caso

### Paso 3. Crear corrida y encolar

Todo esto debe pasar en una transaccion Prisma:

- crear `AiInspectionRun`
- actualizar estado de orden
- crear `CanonicalEvent`

Despues de la transaccion, encolar el job.

### Paso 4. Procesamiento en background

El worker:

- descarga contexto
- llama IA
- persiste hallazgos
- guarda score y clasificacion
- crea preguntas humanas si la salida vino ambigua

### Paso 5. Resultado de negocio

Resultado recomendado para fase MVP:

- score `90-100`: guardar recomendacion `APPROVED`, pero dejar `PENDING_CERTIFICATION`
- score `70-89`: guardar `MANUAL_REVIEW`, dejar `PENDING_CERTIFICATION`
- score `0-69`: guardar `REJECTED`, dejar `PENDING_CERTIFICATION` o `BLOCKED` segun la politica

Como el documento dice que la IA es asistiva, la orden no debe cerrarse automaticamente.

---

## Endpoints que Debes Agregar

### Crear analisis IA

```http
POST /inspections/:inspectionId/analyze
```

Respuesta:

```json
{
  "inspectionId": "clx...",
  "aiRunId": "clx...",
  "status": "QUEUED"
}
```

### Consultar resultado

```http
GET /inspections/:inspectionId/result
```

Respuesta esperada:

```json
{
  "inspectionId": "clx...",
  "orderStatus": "PENDING_CERTIFICATION",
  "latestRun": {
    "status": "COMPLETED",
    "score": 82,
    "classification": "MANUAL_REVIEW",
    "summary": "Se observan residuos y corrosion localizada."
  },
  "findings": []
}
```

### Certificar

```http
POST /inspections/:inspectionId/certify
```

---

## Prompt Base Recomendado para la IA

Crear `src/modules/ai/prompts/tank-inspection.prompt.ts` con una funcion tipo:

```ts
export function buildTankInspectionPrompt(context: {
  tankSerial: string;
  isoCode?: string | null;
  operationType?: string | null;
  evidenceCount: number;
}): string
```

El prompt debe pedir:

- evaluacion de limpieza
- residuos visibles
- corrosion
- daños estructurales
- fugas
- valvulas y accesorios visibles
- zonas afectadas
- score de 0 a 100
- clasificacion `APPROVED`, `MANUAL_REVIEW` o `REJECTED`
- salida JSON estricta

Tambien debe incluir una instruccion clara:

```text
No tomes decisiones finales de certificacion. Entrega solo una recomendacion tecnica para revision humana.
```

---

## Reglas de Idempotencia

Necesitas evitar duplicados.

Implementa estas reglas:

1. solo una corrida activa por inspeccion
2. si la misma evidencia ya fue analizada sin cambios, reutilizar ultimo resultado o bloquear nueva corrida
3. usar `correlationId` por solicitud

Una estrategia simple es calcular un hash con:

- `inspectionId`
- lista ordenada de `evidence.id`
- `updatedAt` de evidencias

Si el hash no cambia, no reproceses.

---

## Uso de `CanonicalEvent`, `AgentAction` y `SystemQuestion`

### `CanonicalEvent`

Usalo para trazabilidad:

- job encolado
- job iniciado
- job completado
- job fallido
- certificacion solicitada

### `AgentAction`

Usalo para guardar decisiones sugeridas por IA:

- sugerencia de aprobar
- sugerencia de bloqueo
- resumen del razonamiento

### `SystemQuestion`

Usalo cuando la IA no tenga suficiente confianza:

- no identifica zona ITCO
- evidencia insuficiente
- conflicto entre imagenes
- daño posible sin confirmacion

Esto te da un flujo HITL limpio sin forzar automatizacion dura.

---

## Orden de Implementacion Sugerido

### Fase 1

- agregar Redis y BullMQ
- crear modulo `ai`
- crear tabla `AiInspectionRun`
- crear endpoint `POST /inspections/:id/analyze`
- encolar y procesar job falso

### Fase 2

- integrar OpenAI real
- persistir score, clasificacion y resumen
- exponer `GET /inspections/:id/result`

### Fase 3

- crear `Finding` desde salida IA
- registrar `CanonicalEvent`, `AgentAction`, `SystemQuestion`
- agregar certificacion humana

### Fase 4

- alinear totalmente `WashOrderStatus` con el documento funcional
- reutilizar el mismo patron async para email y notificaciones

---

## Pruebas Minimas que Debes Cubrir

### Unitarias

- no permite analisis sin evidencias
- no permite doble corrida activa
- clasifica correctamente score a recomendacion
- marca `FAILED` si OpenAI falla

### Integracion

- `POST /inspections/:id/analyze` crea corrida y encola job
- worker procesa y persiste resultado
- `GET /inspections/:id/result` devuelve corrida y hallazgos

### Casos limite

- imagen corrupta
- URLs privadas sin acceso
- timeout del proveedor IA
- corrida duplicada
- orden ya certificada

---

## Ejemplo de Secuencia de Llamadas

```text
EvidenceController.upload
  -> EvidenceService.upload
  -> usuario solicita analisis
  -> InspectionsController.analyze
  -> InspectionsService.requestAiAnalysis
  -> BullMQ enqueue
  -> AiProcessor.handleInspectionAnalysisJob
  -> AiService.analyzeInspection
  -> persistAiFindings
  -> WashOrder pasa a PENDING_CERTIFICATION
  -> InspectionsController.getResult
  -> jefe certifica
```

---

## Recomendacion de Implementacion para Este Repo

Si vas a hacerlo por el camino mas estable, el siguiente orden de archivos es el mas natural para este proyecto:

1. `prisma/schema.prisma`
2. `src/app.module.ts`
3. `src/modules/inspections/*`
4. `src/modules/ai/*`
5. `src/modules/evidence/evidence.service.ts`
6. `src/modules/wash-orders/wash-orders.service.ts`

---

## Decision Tecnica Recomendada

Para este backend no intentaria meter la IA directo dentro de `EvidenceService.upload(...)`.

La mejor separacion es:

- `upload` solo guarda evidencia
- `analyze` crea corrida async
- `processor` ejecuta IA
- `certify` cierra el proceso humano

Eso mantiene la API rapida, evita timeouts y deja trazabilidad.

---

## Siguiente Paso Recomendado

El siguiente cambio real de codigo deberia ser este:

1. agregar dependencias de BullMQ y OpenAI
2. crear migracion con `AiInspectionRun`
3. crear modulo `inspections`
4. exponer `POST /inspections/:inspectionId/analyze`
5. montar un worker que primero responda con datos simulados

Cuando eso funcione, se conecta OpenAI y luego se agrega el mapeo a `Finding`.
