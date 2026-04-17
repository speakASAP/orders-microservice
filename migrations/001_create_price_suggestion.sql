-- Price suggestion storage for dynamic pricing workflow (TASK-P10-T27)
-- Run manually on orders DB before enabling pricing generation in production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS price_suggestion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" varchar(255) NOT NULL,
  "productName" varchar(500) NOT NULL,
  "currentPrice" numeric(10, 2) NOT NULL,
  "suggestedPrice" numeric(10, 2) NOT NULL,
  "changePercent" double precision NOT NULL,
  rationale text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_suggestion_status_created_at
  ON price_suggestion (status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_price_suggestion_product_status
  ON price_suggestion ("productId", status);
