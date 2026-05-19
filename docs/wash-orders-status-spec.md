# Especificación de Estados y Asignaciones — Órdenes de Lavado

**Versión:** 2.0  
**Fecha:** 2026-05-18  
**Para:** Equipo Frontend

---

## 1. Resumen del sistema de estados

Las órdenes de lavado ahora tienen **8 estados principales** (reducidos desde 19). Los sub-estados de progreso operativo se manejan en un campo separado (`subStatus`) para no contaminar el flujo principal.

---

## 2. Estados principales (`status`)

| Estado | Valor API | Quién lo asigna | Descripción |
|--------|-----------|-----------------|-------------|
| Necesita revisión | `NEEDS_REVIEW` | Sistema (API externa) | La orden llegó de un sistema externo y requiere revisión antes de aprobarse |
| Aprobado | `APPROVED` | Admin / Coordinador | La orden fue tomada/aprobada pero aún no tiene operario asignado |
| Rechazado | `REJECTED` | Admin / Coordinador | La orden tiene datos incorrectos o incompletos. **Siempre lleva comentario.** Estado temporal |
| Asignado | `ASSIGNED` | Sistema (al asignar operario) | Se asignó un operario. Desde aquí el operario puede ver y modificar la orden |
| En progreso | `IN_PROGRESS` | Operario | El operario está ejecutando el trabajo. El sub-estado detalla el paso actual |
| En revisión | `IN_REVIEW` | Operario | El operario terminó y envió la orden a inspección |
| Completado | `COMPLETED` | Admin / Coordinador | La orden pasó los protocolos de inspección. **Estado final, no se puede eliminar** |
| Cancelado | `CANCELLED` | Admin / Coordinador | La orden fue cancelada |

---

## 3. Flujo de estados

```
                    [API Externa]
                         │
                    NEEDS_REVIEW
                    /           \
               APPROVED        REJECTED ─────────┐
                  │               │               │
                  │ (asignar)     ↓               │
               ASSIGNED ◄── APPROVED / ASSIGNED   │
                  │                               │
                  ↓                               │
             IN_PROGRESS ──────────────────► REJECTED
                  │                               │
                  ↓                               │
              IN_REVIEW ────────────────────► REJECTED
                  │
                  ↓
              COMPLETED (terminal)

              CANCELLED (terminal — desde cualquier estado excepto COMPLETED)
```

### Tabla de transiciones permitidas

| Estado actual | Puede pasar a |
|---------------|---------------|
| `NEEDS_REVIEW` | `APPROVED`, `REJECTED`, `CANCELLED` |
| `APPROVED` | `REJECTED`, `CANCELLED` *(también a `ASSIGNED` automáticamente al asignar operario)* |
| `REJECTED` | `APPROVED`, `ASSIGNED`, `CANCELLED` |
| `ASSIGNED` | `IN_PROGRESS` *(operario)*, `REJECTED`, `CANCELLED` *(admin)* |
| `IN_PROGRESS` | `IN_REVIEW` *(operario)*, `REJECTED` *(admin)* |
| `IN_REVIEW` | `COMPLETED`, `REJECTED` *(solo admin/coordinador)* |
| `COMPLETED` | *(ninguno — estado terminal)* |
| `CANCELLED` | *(ninguno — estado terminal)* |

> **Nota:** El estado `ASSIGNED` se asigna **automáticamente** por el backend al momento de asignar un operario (endpoint de assignments). No se puede transicionar a `ASSIGNED` manualmente via `/status`.

---

## 4. Estado rechazado — Reglas especiales

- **Siempre** requiere un comentario (`rejectionReason`). Si se envía sin comentario, el backend retorna `400 Bad Request`.
- El backend guarda la fecha del rechazo en `rejectedAt`. Este campo se usará para notificaciones futuras cuando la orden lleva demasiado tiempo rechazada.
- Es un estado **temporal**: el admin debe tomar acción (re-aprobar o cancelar).
- En el frontend se recomienda mostrar una alerta visual prominente para órdenes en `REJECTED`.

---

## 5. Sub-estados (`subStatus`) — Solo durante `IN_PROGRESS`

Mientras una orden está en `IN_PROGRESS`, el operario puede actualizar el sub-estado para indicar en qué paso del proceso se encuentra. El estado principal siempre permanece `IN_PROGRESS`.

| Sub-estado | Valor API | Descripción |
|------------|-----------|-------------|
| Preparación | `PREPARATION` | Preparación del área y equipo |
| Lavado | `CLEANING` | Lavado en curso |
| Secado | `DRYING` | Secado en curso |
| Pre-inspección | `PRE_INSPECTION` | Revisión previa a la inspección final |
| Prueba neumática | `PNEUMATIC_TEST` | Prueba de hermeticidad |
| Esperando QI | `WAITING_QI` | Esperando inspector de calidad |

### Comportamiento del subStatus:
- Solo es válido cuando `status === "IN_PROGRESS"`. Si el estado cambia, `subStatus` vuelve a `null`.
- El campo es **opcional** — el operario puede operar sin sub-estados.
- Se puede enviar el primer sub-estado en el mismo request de cambio a `IN_PROGRESS` (campo `subStatus` en el body de `/status`).
- Para cambiar el sub-estado sin cambiar el estado principal, usar el endpoint dedicado `PATCH /wash-orders/:id/sub-status`.

---

## 6. Visibilidad por rol

| Rol | Qué órdenes ve |
|-----|----------------|
| `ADMIN` | **Todas** las órdenes, incluyendo `NEEDS_REVIEW` |
| `COORDINATOR` | **Todas** las órdenes, incluyendo `NEEDS_REVIEW` |
| `OPERATOR` | Solo las órdenes donde está asignado (nunca ve `NEEDS_REVIEW`) |
| Otros roles | Solo las órdenes donde están asignados |

---

## 7. Permisos de modificación

### Editar campos de la orden (`PATCH /wash-orders/:id`)

| Rol | Puede editar si status es |
|-----|--------------------------|
| `ADMIN` / `COORDINATOR` | Cualquier estado |
| `OPERATOR` | Solo `ASSIGNED`, `IN_PROGRESS`, `IN_REVIEW` (y debe estar asignado) |

### Cambiar estado (`PATCH /wash-orders/:id/status`)

| Transición | Quién puede hacerlo |
|------------|---------------------|
| `ASSIGNED → IN_PROGRESS` | Operario asignado |
| `IN_PROGRESS → IN_REVIEW` | Operario asignado |
| Cualquier otra transición | Solo Admin / Coordinador |

### Eliminar orden (`DELETE /wash-orders/:id`)

- Solo Admin / Coordinador.
- **Las órdenes `COMPLETED` nunca se pueden eliminar** — el backend retorna `400 Bad Request`.

---

## 8. Endpoints afectados

### `GET /api/v1/wash-orders`

**Query params:** `?status=APPROVED` (opcional)

- Admin/Coordinador: retorna todas las órdenes (o filtradas por status).
- Operario: retorna solo sus órdenes asignadas. Si no pasa `status`, excluye automáticamente `NEEDS_REVIEW`.

### `GET /api/v1/wash-orders/:id`

- Admin/Coordinador: accede a cualquier orden.
- Operario: solo si está asignado, de lo contrario `403 Forbidden`.

### `PATCH /api/v1/wash-orders/:id`

Editar campos de la orden. Ver tabla de permisos de modificación arriba.

### `PATCH /api/v1/wash-orders/:id/status`

Cambiar el estado principal.

**Request body:**
```json
{
  "status": "IN_PROGRESS",
  "subStatus": "PREPARATION",   // Opcional, solo válido al pasar a IN_PROGRESS
  "rejectionReason": "..."      // Requerido solo si status = "REJECTED"
}
```

**Respuestas de error:**
- `400` — Transición inválida, o falta `rejectionReason` al rechazar.
- `403` — El operario intenta una transición que no le corresponde.

### `PATCH /api/v1/wash-orders/:id/sub-status`

Actualizar el sub-estado mientras la orden está `IN_PROGRESS`.

**Request body:**
```json
{
  "subStatus": "CLEANING"
}
```

- `400` si la orden no está en `IN_PROGRESS`.

### `DELETE /api/v1/wash-orders/:id`

- `400` si la orden está `COMPLETED`.
- `403` si el usuario no es Admin/Coordinador.

### `GET /api/v1/wash-orders/stats`

Retorna conteo por estado. Admin ve totales globales, operario ve solo sus órdenes asignadas.

**Response:**
```json
{
  "total": 42,
  "needs_review": 3,
  "approved": 8,
  "rejected": 2,
  "assigned": 5,
  "in_progress": 10,
  "in_review": 4,
  "completed": 18,
  "cancelled": 2
}
```

### `POST /api/v1/wash-orders/:orderId/assignments`

Asignar operario. Solo Admin/Coordinador. La orden debe estar en `APPROVED` o `REJECTED`.

Al asignar exitosamente, el backend mueve automáticamente el status a `ASSIGNED`.

**Request body:**
```json
{
  "userId": "...",
  "role": "OPERATOR"
}
```

### `DELETE /api/v1/wash-orders/:orderId/assignments/:userId`

Desasignar operario. Solo Admin/Coordinador.

Si la orden queda sin operarios, el backend revierte automáticamente el status a `APPROVED`.

---

## 9. Campos relevantes en la respuesta de WashOrder

```ts
{
  id: string
  orderNumber: string          // Ej: "WO-202605-0001"
  status: WashOrderStatus      // Estado principal
  subStatus: WashOrderSubStatus | null  // Solo válido en IN_PROGRESS
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW"
  
  // Fechas de ciclo de vida
  createdAt: string            // ISO 8601
  startedAt: string | null     // Cuando pasó a IN_PROGRESS
  completedAt: string | null   // Cuando completó
  rejectedAt: string | null    // Última vez que fue rechazada
  rejectionReason: string | null  // Comentario del último rechazo
  
  assignments: WashOrderAssignment[]  // Operarios asignados
  client: Client | null
  tank: IsoTank | null
  evidences: Evidence[]
}
```

---

## 10. Recomendaciones para la UI

### Bandeja de órdenes (Admin/Coordinador)
- Mostrar filtros rápidos por estado.
- La columna `NEEDS_REVIEW` debe destacarse visualmente (badge distinto) ya que son órdenes externas no verificadas.
- Las órdenes `REJECTED` deben mostrar un indicador de alerta con la fecha de rechazo (`rejectedAt`) y el motivo.

### Bandeja del operario
- Solo muestra órdenes asignadas. No mostrar filtro de `NEEDS_REVIEW`.
- El operario solo puede cambiar estado en su propia orden: botón "Iniciar" (`ASSIGNED → IN_PROGRESS`) y "Enviar a revisión" (`IN_PROGRESS → IN_REVIEW`).
- Dentro de `IN_PROGRESS`, mostrar selector de sub-estado para que el operario indique el paso actual.

### Formulario de rechazo
- Al rechazar una orden (admin), mostrar modal obligatorio con campo de texto para `rejectionReason`.
- No permitir enviar sin comentario.

### Orden completada
- El botón "Eliminar" debe estar deshabilitado y con tooltip explicativo para órdenes `COMPLETED`.
- Considerar mostrar el historial de la orden (timestamps de cada estado) en el detalle.

### Badge de estado sugerido
```
NEEDS_REVIEW  → Amarillo oscuro / naranja  "Pendiente revisión"
APPROVED      → Azul                       "Aprobada"
REJECTED      → Rojo                       "Rechazada"
ASSIGNED      → Púrpura                   "Asignada"
IN_PROGRESS   → Naranja                   "En progreso"
IN_REVIEW     → Cian / teal               "En revisión"
COMPLETED     → Verde                     "Completada"
CANCELLED     → Gris                      "Cancelada"
```

---

## 11. Migración de datos (para el equipo backend)

Si existe data previa en la base de datos con los estados antiguos, ejecutar el siguiente SQL **antes** de aplicar la migración de Prisma:

```sql
-- Mapeo de estados anteriores a los nuevos
UPDATE wash_orders SET status = 'APPROVED'     WHERE status IN ('PENDING', 'PENDING_APPROVAL', 'SCHEDULED');
UPDATE wash_orders SET status = 'IN_PROGRESS'  WHERE status IN ('PREPARATION', 'CLEANING', 'DRYING', 'PNEUMATIC_TEST', 'BLOCKED');
UPDATE wash_orders SET status = 'IN_REVIEW'    WHERE status IN ('PRE_INSPECTION', 'IA_REVIEW', 'PENDING_CERTIFICATION', 'WAITING_QI');
UPDATE wash_orders SET status = 'REJECTED'     WHERE status IN ('REJECTED_PENDING_INFO');
-- Luego ejecutar: npx prisma migrate dev --name simplify_wash_order_status
```
