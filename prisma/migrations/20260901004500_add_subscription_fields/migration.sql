-- AlterTable
ALTER TABLE "users" 
ADD COLUMN "is_subscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "subscription_end_date" TIMESTAMP(3);
