-- Core Orders schema for production environments where TypeORM synchronize is disabled.
-- Matches the current TypeORM entities for orders, order_items, and shipments.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "externalOrderId" varchar(200),
  channel varchar(100) NOT NULL,
  "channelAccountId" varchar(200),
  status varchar(50) NOT NULL DEFAULT 'pending',
  customer jsonb,
  "shippingAddress" jsonb,
  "billingAddress" jsonb,
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  "shippingCost" numeric(10, 2) NOT NULL DEFAULT 0,
  "taxAmount" numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'CZK',
  "paymentMethod" varchar(100),
  "paymentStatus" varchar(50),
  "shippingMethod" varchar(100),
  "customerNote" text,
  "internalNote" text,
  "warehouseHandoff" jsonb,
  "orderedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "productId" varchar NOT NULL,
  sku varchar(100),
  title varchar(500) NOT NULL,
  quantity integer NOT NULL,
  "unitPrice" numeric(10, 2) NOT NULL,
  "totalPrice" numeric(10, 2) NOT NULL,
  "fulfillmentStatus" varchar(50) NOT NULL DEFAULT 'pending',
  "warehouseId" varchar,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" varchar NOT NULL,
  carrier varchar(100) NOT NULL,
  "trackingNumber" varchar(200),
  "trackingUrl" varchar(500),
  status varchar(50) NOT NULL DEFAULT 'created',
  "shippedAt" timestamp,
  "deliveredAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_channel_created_at
  ON orders (channel, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON orders (status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_orders_external_channel
  ON orders ("externalOrderId", channel);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id
  ON shipments ("orderId");
