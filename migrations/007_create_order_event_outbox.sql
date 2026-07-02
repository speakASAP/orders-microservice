-- Durable Orders lifecycle event outbox for environments where TypeORM synchronize is disabled.
-- Matches src/orders/order-event-outbox.entity.ts.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS order_event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "exchangeName" varchar(100) NOT NULL,
  "routingKey" varchar(160) NOT NULL,
  "eventType" varchar(40) NOT NULL,
  "eventVersion" integer NOT NULL DEFAULT 1,
  "eventId" uuid NOT NULL,
  payload jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  "lastAttemptAt" timestamp NULL,
  "publishedAt" timestamp NULL,
  "lastErrorCode" varchar(120) NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_event_outbox_event_id
  ON order_event_outbox ("eventId");

CREATE INDEX IF NOT EXISTS idx_order_event_outbox_status_created
  ON order_event_outbox (status, "createdAt");

CREATE INDEX IF NOT EXISTS idx_order_event_outbox_routing_key
  ON order_event_outbox ("routingKey");
