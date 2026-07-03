-- Persist bounded order status transition approval/idempotency audit metadata.
-- Values are sanitized by src/orders/status-transitions.ts and must not include raw provider, customer, token, or bank data.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "statusTransitionAudit" jsonb;
