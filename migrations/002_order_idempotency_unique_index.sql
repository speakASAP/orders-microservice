-- Database-level guard for Orders create idempotency.
-- The current create contract version is validated by the API and not persisted in the
-- orders table, so this index enforces the persisted idempotency key dimensions.
DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_orders_create_idempotency
      ON public.orders (
        channel,
        COALESCE("channelAccountId", ''),
        "externalOrderId"
      )
      WHERE "externalOrderId" IS NOT NULL;
  END IF;
END $$;
