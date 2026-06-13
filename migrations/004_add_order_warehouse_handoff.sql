-- Audit-safe Warehouse handoff metadata for Orders reservation choreography.
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS "warehouseHandoff" jsonb;
