-- Bounded Payments-owned status references for Orders.
-- Orders stores only payment status/reference metadata and does not own provider identity or reconciliation.
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS "paymentReferenceId" varchar(200),
  ADD COLUMN IF NOT EXISTS "paymentApplicationId" varchar(100),
  ADD COLUMN IF NOT EXISTS "paymentUpdatedAt" timestamp;
