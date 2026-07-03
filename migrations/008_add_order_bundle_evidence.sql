-- Additive Catalog bundle metadata evidence for Orders create/replay.
-- Bundle evidence is audit metadata only; normal order item rows remain product-line truth.
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS "bundleEvidence" jsonb;
