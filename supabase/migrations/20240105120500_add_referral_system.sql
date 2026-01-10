-- Add referral system columns to clients table
ALTER TABLE "public"."clients" ADD COLUMN "referral_code" text UNIQUE DEFAULT "substring"(md5(random()::text), 1, 8);
ALTER TABLE "public"."clients" ADD COLUMN "referred_by" uuid REFERENCES "public"."clients"("id");

-- Index for faster lookups
CREATE INDEX "idx_clients_referral_code" ON "public"."clients" ("referral_code");
CREATE INDEX "idx_clients_referred_by" ON "public"."clients" ("referred_by");
