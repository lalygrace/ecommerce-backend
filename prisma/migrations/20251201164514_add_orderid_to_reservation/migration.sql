-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "orderId" UUID,
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "Reservation_orderId_idx" ON "Reservation"("orderId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
