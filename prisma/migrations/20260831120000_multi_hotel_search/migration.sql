-- DropForeignKey
ALTER TABLE "search_logs" DROP CONSTRAINT IF EXISTS "search_logs_hotel_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "search_logs_query_hotel_id_idx";

-- AlterTable
ALTER TABLE "search_logs" DROP COLUMN IF EXISTS "hotel_id";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "search_logs_query_idx" ON "search_logs"("query");

-- CreateTable
CREATE TABLE IF NOT EXISTS "_SearchLogToHotel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_SearchLogToHotel_AB_unique" ON "_SearchLogToHotel"("A", "B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_SearchLogToHotel_B_index" ON "_SearchLogToHotel"("B");

-- AddForeignKey (PostgreSQL doesn't support IF NOT EXISTS for constraints directly, so we use a DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_SearchLogToHotel_A_fkey') THEN
        ALTER TABLE "_SearchLogToHotel" ADD CONSTRAINT "_SearchLogToHotel_A_fkey" FOREIGN KEY ("A") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_SearchLogToHotel_B_fkey') THEN
        ALTER TABLE "_SearchLogToHotel" ADD CONSTRAINT "_SearchLogToHotel_B_fkey" FOREIGN KEY ("B") REFERENCES "search_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
