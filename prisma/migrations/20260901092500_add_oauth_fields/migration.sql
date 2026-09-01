-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "users" ADD COLUMN "provider_id" TEXT;
