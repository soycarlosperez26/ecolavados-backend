-- AlterEnum
ALTER TYPE "WashOrderStatus" ADD VALUE 'NEEDS_REVIEW';

-- DropForeignKey
ALTER TABLE "wash_orders" DROP CONSTRAINT "wash_orders_clientId_fkey";

-- DropForeignKey
ALTER TABLE "wash_orders" DROP CONSTRAINT "wash_orders_tankId_fkey";

-- AlterTable
ALTER TABLE "wash_orders" ALTER COLUMN "companyId" DROP NOT NULL,
ALTER COLUMN "tankId" DROP NOT NULL,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "wash_orders" ADD CONSTRAINT "wash_orders_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "iso_tanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wash_orders" ADD CONSTRAINT "wash_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
