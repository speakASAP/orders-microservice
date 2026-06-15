-- Bounded human approval provenance for pricing suggestions.
-- Stores safe actor identifiers only; no tokens, raw JWTs, payment data, or customer data.
ALTER TABLE IF EXISTS price_suggestion
  ADD COLUMN IF NOT EXISTS "approvedAt" timestamp,
  ADD COLUMN IF NOT EXISTS "approvedBy" varchar(200),
  ADD COLUMN IF NOT EXISTS "rejectedAt" timestamp,
  ADD COLUMN IF NOT EXISTS "rejectedBy" varchar(200);
