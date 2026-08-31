-- DropForeignKey
ALTER TABLE "search_logs" DROP CONSTRAINT "search_logs_hotel_id_fkey";

-- DropIndex
DROP INDEX "search_logs_query_hotel_id_idx";

-- AlterTable
ALTER TABLE "search_logs" DROP COLUMN "hotel_id";

-- CreateIndex
CREATE INDEX "search_logs_query_idx" ON "search_logs"("query");

-- CreateTable
CREATE TABLE "_SearchLogToHotel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SearchLogToHotel_AB_unique" ON "_SearchLogToHotel"("A", "B");

-- CreateIndex
CREATE INDEX "_SearchLogToHotel_B_index" ON "_SearchLogToHotel"("B");

-- AddForeignKey
ALTER TABLE "_SearchLogToHotel" ADD CONSTRAINT "_SearchLogToHotel_A_fkey" FOREIGN KEY ("A") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SearchLogToHotel" ADD CONSTRAINT "_SearchLogToHotel_B_fkey" FOREIGN KEY ("B") REFERENCES "search_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
