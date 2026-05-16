# Contrato API Frontend

Documento generado a partir del código actual del backend NestJS.

Base URL:

```ts
const API_BASE_URL = '/api/v1';
```

## Convenciones

- Todos los `id` son `string`.
- Los `DateTime` de Prisma se serializan como `string` ISO 8601.
- Los `Decimal` de Prisma se serializan como `string`.
- Los enums llegan como `string` en mayúsculas.
- Salvo login, los endpoints usan `Authorization: Bearer <accessToken>`.
- El backend tiene `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`.

## Tipos compartidos sugeridos para frontend

```ts
export type Id = string;
export type ISODateString = string;
export type DecimalString = string;
export type JsonValue = unknown;

export type UserRole =
  | 'ADMIN'
  | 'COORDINATOR'
  | 'OPERATOR'
  | 'SUPERVISOR'
  | 'INSPECTOR'
  | 'COMMERCIAL'
  | 'HSEQ'
  | 'DRIVER';

export type AssignmentRole =
  | 'OPERATOR'
  | 'SUPERVISOR'
  | 'INSPECTOR'
  | 'DRIVER';

export type WashOrderStatus =
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'REJECTED_PENDING_INFO'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PREPARATION'
  | 'CLEANING'
  | 'DRYING'
  | 'PRE_INSPECTION'
  | 'IA_REVIEW'
  | 'PENDING_CERTIFICATION'
  | 'PNEUMATIC_TEST'
  | 'WAITING_QI'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'REJECTED'
  | 'CANCELLED';

export type Priority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type EvidenceType =
  | 'PRE_WASH'
  | 'DURING_WASH'
  | 'POST_WASH'
  | 'FINDING_PHOTO'
  | 'REPAIR_BEFORE'
  | 'REPAIR_AFTER'
  | 'SEAL_PHOTO'
  | 'PNEUMATIC_TEST'
  | 'DOCUMENT_SCAN'
  | 'SIGNATURE'
  | 'OTHER';

export type InspectionType =
  | 'EIR'
  | 'INTERNAL'
  | 'PRE_DISPATCH'
  | 'PERIODIC'
  | 'IMDG';

export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type InspectionResult = 'PASS' | 'PASS_WITH_OBSERVATIONS' | 'FAIL';

export type AiInspectionRunStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type AiClassification = 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus =
  | 'OPEN'
  | 'REQUEST_SENT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED_BY_CUSTOMER'
  | 'IN_REPAIR'
  | 'CLOSED'
  | 'DEFERRED';

export type InternalStatus =
  | 'DIRTY'
  | 'CLEANING'
  | 'WAITING_QI'
  | 'CLEAN_WITH_STAINS'
  | 'CLEAN'
  | 'AVAILABLE_INTERNAL';

export type ExternalStatus =
  | 'NOT_EVALUATED'
  | 'DAMAGE_DETECTED_EIR'
  | 'DAMAGE_DETECTED_INSPECTION'
  | 'REQUEST_PENDING'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'IN_REPAIR'
  | 'AVAILABLE_EXTERNAL';

export type OperationalTestStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_INSPECTION'
  | 'PASSED'
  | 'FAILED'
  | 'NOT_REQUIRED';

export type RegulatoryTestStatus =
  | 'VIGENTE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'NOT_REQUIRED'
  | 'TEST_SCHEDULED'
  | 'COMPLETED';

export type ImdgTestType = 'TEST_2_5_YEARS' | 'TEST_5_YEARS';

export interface AuthUser {
  id: Id;
  email: string;
  fullName: string;
  roles: UserRole[];
}

export interface JwtSessionUser {
  sub: Id;
  email: string;
  roles: UserRole[];
}

export interface UserCompanyRoleSummary {
  role: UserRole;
  companyId: Id;
}

export interface UserSummary {
  id: Id;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: ISODateString;
  companyRoles: UserCompanyRoleSummary[];
}

export interface UserUnsafeResponse {
  id: Id;
  supabaseUid: string | null;
  email: string;
  password: string | null;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  refreshToken: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Client {
  id: Id;
  name: string;
  shortName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  slaMaxDays: number;
  billingRules: JsonValue | null;
  requiresMsds: boolean;
  requiresHazmat: boolean;
  companyId: Id;
}

export interface Tank {
  id: Id;
  serialNumber: string;
  isoCode: string | null;
  owner: string | null;
  manufacturer: string | null;
  yearBuilt: number | null;
  capacityL: number | null;
  tare: DecimalString | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  internalStatus: InternalStatus;
  externalStatus: ExternalStatus;
  operationalTest: OperationalTestStatus;
  regulatoryTest: RegulatoryTestStatus;
  regulatoryTestExpiresAt: ISODateString | null;
  nextImdgTestType: ImdgTestType | null;
  isAvailableForDelivery: boolean;
  unavailabilityReasons: string[];
  currentBayId: Id | null;
  currentLocationNote: string | null;
  clientId: Id | null;
}

export interface WashOrderAssignment {
  id: Id;
  washOrderId: Id;
  userId: Id;
  role: AssignmentRole;
  assignedAt: ISODateString;
  releasedAt: ISODateString | null;
}

export interface Evidence {
  id: Id;
  type: EvidenceType;
  fileUrl: string;
  fileKey: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  hash: string | null;
  washOrderId: Id | null;
  findingId: Id | null;
  repairId: Id | null;
  inspectionId: Id | null;
  uploadedById: Id;
  comment: string | null;
  takenAt: ISODateString | null;
  geoLat: DecimalString | null;
  geoLon: DecimalString | null;
  isImmutable: boolean;
  createdAt: ISODateString;
}

export interface EvidenceWithUploader extends Evidence {
  uploadedBy: {
    id: Id;
    fullName: string;
  };
}

export interface WashOrder {
  id: Id;
  orderNumber: string;
  companyId: Id;
  status: WashOrderStatus;
  priority: Priority;
  tankId: Id;
  clientId: Id;
  description: string | null;
  notes: string | null;
  scheduledAt: ISODateString | null;
  slaDeadline: ISODateString | null;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
  rejectedAt: ISODateString | null;
  rejectionReason: string | null;
  cycleTimeHours: DecimalString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  clientRequestId: Id | null;
}

export interface WashOrderWithClientTankAssignments extends WashOrder {
  client: Client;
  tank: Tank;
  assignments: WashOrderAssignment[];
}

export interface WashOrderWithEvidence extends WashOrderWithClientTankAssignments {
  evidences: Evidence[];
}

export interface WashOrderDetail extends WashOrderWithClientTankAssignments {
  evidences: EvidenceWithUploader[];
}

export interface AssignmentWithOrder extends WashOrderAssignment {
  washOrder: {
    id: Id;
    orderNumber: string;
    status: WashOrderStatus;
  };
}

export interface AiInspectionRun {
  id: Id;
  inspectionId: Id;
  washOrderId: Id;
  requestedById: Id;
  status: AiInspectionRunStatus;
  provider: string;
  model: string | null;
  score: number | null;
  classification: AiClassification | null;
  summary: string | null;
  findingsJson: JsonValue | null;
  risksJson: JsonValue | null;
  rawResponse: JsonValue | null;
  errorMessage: string | null;
  evidenceCount: number;
  attempts: number;
  correlationId: string | null;
  evidenceHash: string | null;
  queuedAt: ISODateString;
  startedAt: ISODateString | null;
  finishedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Finding {
  id: Id;
  tankId: Id;
  washOrderId: Id | null;
  inspectionId: Id | null;
  zoneId: Id | null;
  inspectorId: Id;
  itcoZoneCode: string;
  eftcoDamageCode: string;
  eftcoDamageName: string;
  location: string;
  severity: FindingSeverity;
  status: FindingStatus;
  measurementMm: DecimalString | null;
  itcoThreshold: DecimalString | null;
  exceedsFactor: DecimalString | null;
  description: string | null;
  detectedAt: ISODateString;
  resolvedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Inspection {
  id: Id;
  type: InspectionType;
  tankId: Id;
  washOrderId: Id | null;
  inspectorId: Id;
  status: InspectionStatus;
  performedAt: ISODateString | null;
  completedAt: ISODateString | null;
  overallResult: InspectionResult | null;
  notes: string | null;
  signatureUrl: string | null;
  createdAt: ISODateString;
}

export interface InspectionWithInspectorAndRuns extends Inspection {
  inspector: {
    id: Id;
    fullName: string;
    email: string;
  };
  aiRuns: AiInspectionRun[];
}

export interface InspectionDetail extends Inspection {
  inspector: {
    id: Id;
    fullName: string;
    email: string;
  };
  washOrder: {
    id: Id;
    orderNumber: string;
    companyId: Id;
    status: WashOrderStatus;
    priority: Priority;
    tankId: Id;
    clientId: Id;
    description: string | null;
    notes: string | null;
    scheduledAt: ISODateString | null;
    slaDeadline: ISODateString | null;
    startedAt: ISODateString | null;
    completedAt: ISODateString | null;
    rejectedAt: ISODateString | null;
    rejectionReason: string | null;
    cycleTimeHours: DecimalString | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    clientRequestId: Id | null;
    evidences: Evidence[];
  } | null;
  aiRuns: AiInspectionRun[];
  findings: Finding[];
}

export interface WashOrderStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  companyId?: Id;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  companyId?: Id;
  isActive?: boolean;
}

export interface CreateClientRequest {
  name: string;
  companyId: Id;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

export interface CreateTankRequest {
  serialNumber: string;
  isoCode?: string;
  capacityL?: number;
}

export interface UpdateTankRequest extends Partial<CreateTankRequest> {}

export interface CreateWashOrderRequest {
  description: string;
  notes?: string;
  clientId: Id;
  tankId: Id;
  companyId: Id;
  scheduledAt?: ISODateString;
}

export interface UpdateWashOrderRequest extends Partial<CreateWashOrderRequest> {}

export interface ChangeWashOrderStatusRequest {
  status: WashOrderStatus;
  rejectionReason?: string;
}

export interface AssignOperatorRequest {
  userId: Id;
  role?: AssignmentRole;
}

export interface CreateInspectionRequest {
  type: InspectionType;
  notes?: string;
  inspectorId?: Id;
}

export interface RequestAiAnalysisRequest {
  force?: boolean;
}

export interface RequestAiAnalysisResponse {
  inspectionId: Id;
  aiRunId: Id;
  status: AiInspectionRunStatus;
  reused: boolean;
}

export interface GetAiAnalysisResultResponse {
  inspectionId: Id;
  orderStatus: WashOrderStatus | null;
  latestRun: AiInspectionRun | null;
  findings: Finding[];
}

export interface CertifyInspectionRequest {
  approved: boolean;
  notes?: string;
}

export interface CertifyInspectionResponse {
  inspectionId: Id;
  approved: boolean;
  orderStatus: WashOrderStatus;
}
```

## Endpoints

### Auth

| Método | Endpoint | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | No | `LoginRequest` | `LoginResponse` |
| `POST` | `/api/v1/auth/logout` | Bearer | Sin body | `LogoutResponse` |
| `POST` | `/api/v1/auth/refresh` | Bearer refresh token | Sin body | `RefreshResponse` |
| `GET` | `/api/v1/auth/me` | Bearer | Sin body | `JwtSessionUser` |

Notas:

- `auth/me` no devuelve el usuario completo de BD; devuelve el payload del JWT: `sub`, `email`, `roles`.
- `auth/refresh` usa el refresh token en el header `Authorization`.

### Users

| Método | Endpoint | Roles | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/users` | `ADMIN` | `CreateUserRequest` | `UserSummary` |
| `GET` | `/api/v1/users` | `ADMIN`, `COORDINATOR` | Sin body | `UserSummary[]` |
| `PATCH` | `/api/v1/users/:id` | `ADMIN` | `UpdateUserRequest` | `UserSummary` |
| `DELETE` | `/api/v1/users/:id` | `ADMIN` | Sin body | `UserUnsafeResponse` |

Notas:

- El `POST /users` crea primero el usuario y luego la relación de rol/compañía. En la respuesta actual, `companyRoles` puede venir vacío aunque se haya enviado `role` y `companyId`.
- El `DELETE /users/:id` hace soft delete (`isActive = false`) y hoy responde con el objeto completo de Prisma, incluyendo campos sensibles como `password` y `refreshToken`.

### Clients

| Método | Endpoint | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/clients` | Bearer | `CreateClientRequest` | `Client` |
| `GET` | `/api/v1/clients` | Bearer | Sin body | `Client[]` |
| `GET` | `/api/v1/clients/:id` | Bearer | Sin body | `Client & { washOrders: WashOrder[] }` |
| `PATCH` | `/api/v1/clients/:id` | Bearer | `UpdateClientRequest` | `Client` |

Notas:

- `GET /clients` solo devuelve clientes con `isActive = true`.
- `GET /clients/:id` incluye `washOrders`, máximo 10 registros, ordenados por `createdAt desc`.

### Tanks

| Método | Endpoint | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/tanks` | Bearer | `CreateTankRequest` | `Tank` |
| `GET` | `/api/v1/tanks` | Bearer | Sin body | `Tank[]` |
| `GET` | `/api/v1/tanks/:id` | Bearer | Sin body | `Tank` |
| `PATCH` | `/api/v1/tanks/:id` | Bearer | `UpdateTankRequest` | `Tank` |

Notas:

- `GET /tanks` solo devuelve tanques con `isActive = true`.

### Wash Orders

| Método | Endpoint | Roles | Body / Query | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/wash-orders` | `ADMIN`, `COORDINATOR` | `CreateWashOrderRequest` | `WashOrderWithClientTankAssignments` |
| `GET` | `/api/v1/wash-orders` | Bearer | Query opcional `status: WashOrderStatus` | `WashOrderWithEvidence[]` |
| `GET` | `/api/v1/wash-orders/stats` | `ADMIN`, `COORDINATOR` | Sin body | `WashOrderStats` |
| `GET` | `/api/v1/wash-orders/:id` | Bearer | Sin body | `WashOrderDetail` |
| `PATCH` | `/api/v1/wash-orders/:id` | `ADMIN`, `COORDINATOR` | `UpdateWashOrderRequest` | `WashOrder & { client: Client; tank: Tank }` |
| `PATCH` | `/api/v1/wash-orders/:id/status` | Bearer | `ChangeWashOrderStatusRequest` | `WashOrder` |

Notas:

- `POST /wash-orders` genera `orderNumber` automáticamente con formato `WO-YYYYMM-####`.
- `PATCH /wash-orders/:id/status` valida transiciones de estado. Si el cambio no es válido responde `400`.
- Al pasar a `IN_PROGRESS`, `COMPLETED`, `REJECTED` o `REJECTED_PENDING_INFO`, el backend completa fechas y `rejectionReason` automáticamente.

### Evidence

| Método | Endpoint | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/wash-orders/:orderId/evidence` | Bearer | `multipart/form-data` | `EvidenceWithUploader` |
| `GET` | `/api/v1/wash-orders/:orderId/evidence` | Bearer | Sin body | `EvidenceWithUploader[]` |

`POST /wash-orders/:orderId/evidence` usa `multipart/form-data` con:

```ts
type UploadEvidenceFormData = {
  file: File;
  type?: EvidenceType;
  comment?: string;
};
```

Restricciones:

- Tamaño máximo: `10 MB`.
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`.

### Assignments

| Método | Endpoint | Roles | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/wash-orders/:orderId/assignments` | `ADMIN`, `COORDINATOR` | `AssignOperatorRequest` | `AssignmentWithOrder` |
| `DELETE` | `/api/v1/wash-orders/:orderId/assignments/:userId` | `ADMIN`, `COORDINATOR` | Sin body | `{ count: number }` |

Notas:

- Si la orden está en `PENDING`, `PENDING_APPROVAL`, `APPROVED` o `SCHEDULED`, al asignar el backend la mueve a `ASSIGNED`.
- `DELETE` elimina todas las asignaciones de ese usuario en esa orden y responde con el conteo afectado.

### Inspections

| Método | Endpoint | Roles | Body | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/inspections/order/:orderId` | `ADMIN`, `COORDINATOR`, `SUPERVISOR`, `INSPECTOR` | `CreateInspectionRequest` | `Inspection` |
| `GET` | `/api/v1/inspections/order/:orderId` | `ADMIN`, `COORDINATOR`, `SUPERVISOR`, `INSPECTOR` | Sin body | `InspectionWithInspectorAndRuns[]` |
| `GET` | `/api/v1/inspections/:inspectionId` | Bearer | Sin body | `InspectionDetail` |
| `POST` | `/api/v1/inspections/:inspectionId/analyze` | `ADMIN`, `COORDINATOR`, `SUPERVISOR`, `INSPECTOR` | `RequestAiAnalysisRequest` | `RequestAiAnalysisResponse` |
| `GET` | `/api/v1/inspections/:inspectionId/result` | Bearer | Sin body | `GetAiAnalysisResultResponse` |
| `POST` | `/api/v1/inspections/:inspectionId/certify` | `ADMIN`, `COORDINATOR`, `SUPERVISOR`, `INSPECTOR` | `CertifyInspectionRequest` | `CertifyInspectionResponse` |

Notas:

- `POST /inspections/order/:orderId` usa `inspectorId` opcional; si no se envía, toma el usuario autenticado.
- `POST /inspections/:inspectionId/analyze` requiere que la orden esté en uno de estos estados:
  `IN_PROGRESS`, `PREPARATION`, `CLEANING`, `DRYING`, `PRE_INSPECTION`, `WAITING_QI`, `BLOCKED`.
- `POST /inspections/:inspectionId/analyze` requiere un mínimo de evidencias válidas. Por configuración actual el mínimo por defecto es `3`.
- Si ya existe un análisis completado con el mismo hash de evidencias y `force !== true`, reutiliza el run previo y responde `reused: true`.
- Al solicitar análisis nuevo, la orden se mueve a `IA_REVIEW`.
- `POST /inspections/:inspectionId/certify` exige que el último AI run esté en `COMPLETED`.
- `certify` mueve la orden a:
  `COMPLETED` si `approved = true`
  `BLOCKED` si `approved = false`

## Vacíos actuales del contrato

- No hay endpoints expuestos en este backend para `repairs`, `findings`, `companies`, `products`, `service_types`, `drivers`, `transports`, `inventory` o `events`, aunque sí existen modelos en Prisma.
- No hay paginación implementada en listados actuales.
- No hay respuestas tipadas con DTOs de salida; varias respuestas salen directamente desde Prisma.

## Recomendación para frontend

Si van a consumir esto ya, conviene modelar los tipos exactamente como arriba. Si después quieren endurecer el contrato, el siguiente paso natural sería agregar DTOs de respuesta y exportar un OpenAPI consistente para generar tipos automáticamente.
