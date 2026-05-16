-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COORDINATOR', 'OPERATOR', 'SUPERVISOR', 'INSPECTOR', 'COMMERCIAL', 'HSEQ', 'DRIVER');

-- CreateEnum
CREATE TYPE "InternalStatus" AS ENUM ('DIRTY', 'CLEANING', 'WAITING_QI', 'CLEAN_WITH_STAINS', 'CLEAN', 'AVAILABLE_INTERNAL');

-- CreateEnum
CREATE TYPE "ExternalStatus" AS ENUM ('NOT_EVALUATED', 'DAMAGE_DETECTED_EIR', 'DAMAGE_DETECTED_INSPECTION', 'REQUEST_PENDING', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'IN_REPAIR', 'AVAILABLE_EXTERNAL');

-- CreateEnum
CREATE TYPE "OperationalTestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WAITING_INSPECTION', 'PASSED', 'FAILED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "RegulatoryTestStatus" AS ENUM ('VIGENTE', 'EXPIRING_SOON', 'EXPIRED', 'NOT_REQUIRED', 'TEST_SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ImdgTestType" AS ENUM ('TEST_2_5_YEARS', 'TEST_5_YEARS');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PASSED', 'FAILED', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "BayType" AS ENUM ('WASH', 'REPAIR', 'STORAGE', 'INSPECTION', 'DISPATCH');

-- CreateEnum
CREATE TYPE "WashOrderStatus" AS ENUM ('PENDING', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'PNEUMATIC_TEST', 'WAITING_QI', 'COMPLETED', 'BLOCKED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('OPERATOR', 'SUPERVISOR', 'INSPECTOR', 'DRIVER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('EIR', 'INTERNAL', 'PRE_DISPATCH', 'PERIODIC', 'IMDG');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'PASS_WITH_OBSERVATIONS', 'FAIL');

-- CreateEnum
CREATE TYPE "ZoneResult" AS ENUM ('NOT_INSPECTED', 'ACCEPTABLE', 'OBSERVATIONS', 'NOT_ACCEPTABLE');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('OPEN', 'REQUEST_SENT', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED_BY_CUSTOMER', 'IN_REPAIR', 'CLOSED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PRE_WASH', 'DURING_WASH', 'POST_WASH', 'FINDING_PHOTO', 'REPAIR_BEFORE', 'REPAIR_AFTER', 'SEAL_PHOTO', 'PNEUMATIC_TEST', 'DOCUMENT_SCAN', 'SIGNATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('REPAIR_APPROVAL', 'ADDITIONAL_SERVICE', 'INFORMATION', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SENT', 'AWAITING_RESPONSE', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PREFACTURA', 'APPROVED', 'SENT', 'PAID', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PREFACTURA', 'INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- CreateEnum
CREATE TYPE "BascStatus" AS ENUM ('PENDING', 'CLEAR', 'FLAGGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "TransportStatus" AS ENUM ('PENDING', 'ARRIVED', 'PROCESSING', 'CLEARED', 'BLOCKED', 'DEPARTED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TANK_ARRIVED', 'TANK_ENTERED_BAY', 'TANK_WASH_STARTED', 'TANK_WASH_COMPLETED', 'TANK_PNEUMATIC_TEST_STARTED', 'TANK_PNEUMATIC_TEST_PASSED', 'TANK_PNEUMATIC_TEST_FAILED', 'TANK_QI_INSPECTION_STARTED', 'TANK_QI_INSPECTION_PASSED', 'TANK_QI_INSPECTION_FAILED', 'TANK_AVAILABLE_FOR_DELIVERY', 'TANK_BLOCKED', 'TANK_DISPATCHED', 'TANK_IMDG_TEST_SCHEDULED', 'TANK_IMDG_TEST_COMPLETED', 'TANK_IMDG_EXPIRING_SOON', 'FINDING_DETECTED', 'FINDING_SEVERITY_ESCALATED', 'REPAIR_REQUEST_SENT_TO_CLIENT', 'REPAIR_APPROVED_BY_CLIENT', 'REPAIR_REJECTED_BY_CLIENT', 'REPAIR_STARTED', 'REPAIR_COMPLETED', 'REPAIR_VERIFIED', 'CLIENT_REQUEST_CREATED', 'CLIENT_REQUEST_SENT', 'CLIENT_REQUEST_RESPONSE_RECEIVED', 'CLIENT_NO_RESPONSE_ALERT', 'BILLABLE_SERVICE_DETECTED', 'PREFACTURA_GENERATED', 'INVOICE_APPROVED', 'INVOICE_SENT_TO_CONTAPYME', 'INVOICE_PAID', 'DRIVER_BASC_VERIFIED', 'DRIVER_BASC_FLAGGED', 'DOCUMENT_RECEIVED', 'COMPLIANCE_AUDIT_RECORD', 'SLA_AT_RISK', 'SLA_BREACHED', 'OPERATOR_ASSIGNED', 'BAY_ASSIGNED');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('PROGRAMADOR', 'COMERCIAL', 'CUMPLIMIENTO', 'HALLAZGOS', 'FACTURACION', 'INVENTARIO', 'OBSERVADOR');

-- CreateEnum
CREATE TYPE "AgentActionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'EXECUTED', 'REJECTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'RESERVATION');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slaMaxDays" INTEGER NOT NULL DEFAULT 5,
    "billingRules" JSONB,
    "requiresMsds" BOOLEAN NOT NULL DEFAULT true,
    "requiresHazmat" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unNumber" TEXT,
    "imdgClass" TEXT,
    "packingGroup" TEXT,
    "msdsUrl" TEXT,
    "isHazmat" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iso_tanks" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "isoCode" TEXT,
    "owner" TEXT,
    "manufacturer" TEXT,
    "yearBuilt" INTEGER,
    "capacityL" INTEGER,
    "tare" DECIMAL(8,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "internalStatus" "InternalStatus" NOT NULL DEFAULT 'DIRTY',
    "externalStatus" "ExternalStatus" NOT NULL DEFAULT 'NOT_EVALUATED',
    "operationalTest" "OperationalTestStatus" NOT NULL DEFAULT 'PENDING',
    "regulatoryTest" "RegulatoryTestStatus" NOT NULL DEFAULT 'VIGENTE',
    "regulatoryTestExpiresAt" TIMESTAMP(3),
    "nextImdgTestType" "ImdgTestType",
    "isAvailableForDelivery" BOOLEAN NOT NULL DEFAULT false,
    "unavailabilityReasons" TEXT[],
    "currentBayId" TEXT,
    "currentLocationNote" TEXT,
    "clientId" TEXT,

    CONSTRAINT "iso_tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iso_tank_last_loads" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "loadedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "iso_tank_last_loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imdg_tests" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "testType" "ImdgTestType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "performedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "result" "TestResult",
    "certUrl" TEXT,
    "inspector" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imdg_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pneumatic_tests" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "washOrderId" TEXT,
    "pressure" DECIMAL(6,2),
    "performedAt" TIMESTAMP(3),
    "result" "TestResult",
    "evidenceUrl" TEXT,
    "operatorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pneumatic_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bays" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BayType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iso_tank_assignments" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bayId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "iso_tank_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tank_movements" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movedById" TEXT NOT NULL,
    "reason" TEXT,
    "washOrderId" TEXT,

    CONSTRAINT "tank_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "WashOrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "tankId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "slaDeadline" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cycleTimeHours" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientRequestId" TEXT,

    CONSTRAINT "wash_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_order_assignments" (
    "id" TEXT NOT NULL,
    "washOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AssignmentRole" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "wash_order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_services" (
    "id" TEXT NOT NULL,
    "washOrderId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "isBilled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "performedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wash_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "tankId" TEXT NOT NULL,
    "washOrderId" TEXT,
    "inspectorId" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "performedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "overallResult" "InspectionResult",
    "notes" TEXT,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_zones" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "itcoZoneCode" TEXT NOT NULL,
    "itcoZoneName" TEXT NOT NULL,
    "result" "ZoneResult" NOT NULL DEFAULT 'NOT_INSPECTED',
    "measurements" JSONB,
    "notes" TEXT,

    CONSTRAINT "inspection_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "washOrderId" TEXT,
    "inspectionId" TEXT,
    "zoneId" TEXT,
    "inspectorId" TEXT NOT NULL,
    "itcoZoneCode" TEXT NOT NULL,
    "eftcoDamageCode" TEXT NOT NULL,
    "eftcoDamageName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'OPEN',
    "measurementMm" DECIMAL(8,2),
    "itcoThreshold" DECIMAL(8,2),
    "exceedsFactor" DECIMAL(4,2),
    "description" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repairs" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "washOrderId" TEXT,
    "eftcoRepairCode" TEXT NOT NULL,
    "eftcoRepairName" TEXT NOT NULL,
    "description" TEXT,
    "status" "RepairStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedCost" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "actualCost" DECIMAL(12,2),
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "performedById" TEXT,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "hash" TEXT,
    "washOrderId" TEXT,
    "findingId" TEXT,
    "repairId" TEXT,
    "inspectionId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "comment" TEXT,
    "takenAt" TIMESTAMP(3),
    "geoLat" DECIMAL(10,7),
    "geoLon" DECIMAL(10,7),
    "isImmutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "sentAt" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseNotes" TEXT,
    "signatureUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_request_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eftcoRepairCode" TEXT,
    "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "isApproved" BOOLEAN,
    "rejectionReason" TEXT,

    CONSTRAINT "client_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "InvoiceType" NOT NULL DEFAULT 'PREFACTURA',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "contapymeId" TEXT,
    "contapymeSyncedAt" TIMESTAMP(3),
    "contapymeError" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "washServiceId" TEXT,
    "repairId" TEXT,
    "washOrderId" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'CC',
    "documentNumber" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseCategory" TEXT,
    "licenseExpiresAt" TIMESTAMP(3),
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bascVerified" BOOLEAN NOT NULL DEFAULT false,
    "bascVerifiedAt" TIMESTAMP(3),
    "bascStatus" "BascStatus" NOT NULL DEFAULT 'PENDING',
    "bascCheckUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transports" (
    "id" TEXT NOT NULL,
    "type" "TransportType" NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "driverId" TEXT,
    "tankId" TEXT,
    "clientId" TEXT,
    "companyId" TEXT,
    "status" "TransportStatus" NOT NULL DEFAULT 'PENDING',
    "eirInspectionId" TEXT,
    "eirCompletedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canonical_events" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "tankId" TEXT,
    "washOrderId" TEXT,
    "triggeredByUserId" TEXT,
    "triggeredByAgentId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canonical_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_actions" (
    "id" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "actionType" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "AgentActionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "requiresHuman" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "washOrderId" TEXT,
    "tankId" TEXT,
    "findingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_questions" (
    "id" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "question" TEXT NOT NULL,
    "context" JSONB,
    "options" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT,
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "washOrderId" TEXT,
    "tankId" TEXT,
    "findingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "system_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(10,2) NOT NULL,
    "minStock" DECIMAL(10,2) NOT NULL,
    "reorderPoint" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "washOrderId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientRequestToFinding" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_nit_key" ON "companies"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_roles_userId_companyId_role_key" ON "user_company_roles"("userId", "companyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "clients_taxId_key" ON "clients"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_code_key" ON "service_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "iso_tanks_serialNumber_key" ON "iso_tanks"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "iso_tank_last_loads_tankId_key" ON "iso_tank_last_loads"("tankId");

-- CreateIndex
CREATE UNIQUE INDEX "bays_code_key" ON "bays"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wash_orders_orderNumber_key" ON "wash_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "wash_order_assignments_washOrderId_userId_role_key" ON "wash_order_assignments"("washOrderId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "client_requests_requestNumber_key" ON "client_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_washServiceId_key" ON "invoice_items"("washServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_documentNumber_key" ON "drivers"("documentNumber");

-- CreateIndex
CREATE INDEX "canonical_events_type_idx" ON "canonical_events"("type");

-- CreateIndex
CREATE INDEX "canonical_events_aggregateId_idx" ON "canonical_events"("aggregateId");

-- CreateIndex
CREATE INDEX "canonical_events_occurredAt_idx" ON "canonical_events"("occurredAt");

-- CreateIndex
CREATE INDEX "canonical_events_publishedAt_idx" ON "canonical_events"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_code_key" ON "inventory_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_ClientRequestToFinding_AB_unique" ON "_ClientRequestToFinding"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientRequestToFinding_B_index" ON "_ClientRequestToFinding"("B");

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_roles" ADD CONSTRAINT "user_company_roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tanks" ADD CONSTRAINT "iso_tanks_currentBayId_fkey" FOREIGN KEY ("currentBayId") REFERENCES "bays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tanks" ADD CONSTRAINT "iso_tanks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tank_last_loads" ADD CONSTRAINT "iso_tank_last_loads_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tank_last_loads" ADD CONSTRAINT "iso_tank_last_loads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imdg_tests" ADD CONSTRAINT "imdg_tests_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pneumatic_tests" ADD CONSTRAINT "pneumatic_tests_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pneumatic_tests" ADD CONSTRAINT "pneumatic_tests_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tank_assignments" ADD CONSTRAINT "iso_tank_assignments_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tank_assignments" ADD CONSTRAINT "iso_tank_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_tank_assignments" ADD CONSTRAINT "iso_tank_assignments_bayId_fkey" FOREIGN KEY ("bayId") REFERENCES "bays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tank_movements" ADD CONSTRAINT "tank_movements_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tank_movements" ADD CONSTRAINT "tank_movements_movedById_fkey" FOREIGN KEY ("movedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_orders" ADD CONSTRAINT "wash_orders_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_orders" ADD CONSTRAINT "wash_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_orders" ADD CONSTRAINT "wash_orders_clientRequestId_fkey" FOREIGN KEY ("clientRequestId") REFERENCES "client_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_order_assignments" ADD CONSTRAINT "wash_order_assignments_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_services" ADD CONSTRAINT "wash_services_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_services" ADD CONSTRAINT "wash_services_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_services" ADD CONSTRAINT "wash_services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_zones" ADD CONSTRAINT "inspection_zones_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "inspection_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_requests" ADD CONSTRAINT "client_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_request_items" ADD CONSTRAINT "client_request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "client_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_washServiceId_fkey" FOREIGN KEY ("washServiceId") REFERENCES "wash_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repairs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transports" ADD CONSTRAINT "transports_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_events" ADD CONSTRAINT "canonical_events_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canonical_events" ADD CONSTRAINT "canonical_events_washOrderId_fkey" FOREIGN KEY ("washOrderId") REFERENCES "wash_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_questions" ADD CONSTRAINT "system_questions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientRequestToFinding" ADD CONSTRAINT "_ClientRequestToFinding_A_fkey" FOREIGN KEY ("A") REFERENCES "client_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientRequestToFinding" ADD CONSTRAINT "_ClientRequestToFinding_B_fkey" FOREIGN KEY ("B") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
