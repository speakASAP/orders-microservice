#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-statex-apps}"
POSTGRES_DEPLOYMENT="${POSTGRES_DEPLOYMENT:-deploy/db-server-postgres}"
DB_USER="${DB_USER:-dbadmin}"
DB_NAME="${DB_NAME:-orders}"
CHANNEL="codex-race"
ACCOUNT_ID="acct-1"
EXTERNAL_ID="codex-concurrency-$(date +%s%N)"

psql_exec() {
  kubectl -n "$NAMESPACE" exec "$POSTGRES_DEPLOYMENT" -- \
    psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

INDEX_PRESENT="$(psql_exec -At -c "select count(*) from pg_indexes where schemaname = 'public' and indexname = 'ux_orders_create_idempotency';")"
if [ "$INDEX_PRESENT" != "1" ]; then
  echo "ux_orders_create_idempotency is missing" >&2
  exit 1
fi

SQL="insert into orders (channel, \"channelAccountId\", \"externalOrderId\") values ('${CHANNEL}', '${ACCOUNT_ID}', '${EXTERNAL_ID}');"
OUT1="/tmp/orders-race-1-${EXTERNAL_ID}.log"
OUT2="/tmp/orders-race-2-${EXTERNAL_ID}.log"

psql_exec -v ON_ERROR_STOP=1 -c "$SQL" >"$OUT1" 2>&1 &
PID1=$!
psql_exec -v ON_ERROR_STOP=1 -c "$SQL" >"$OUT2" 2>&1 &
PID2=$!

set +e
wait "$PID1"; STATUS1=$?
wait "$PID2"; STATUS2=$?
set -e

echo "external_id=$EXTERNAL_ID"
echo "status1=$STATUS1"
cat "$OUT1"
echo "status2=$STATUS2"
cat "$OUT2"

ROW_COUNT="$(psql_exec -At -c "select count(*) from orders where channel = '${CHANNEL}' and \"channelAccountId\" = '${ACCOUNT_ID}' and \"externalOrderId\" = '${EXTERNAL_ID}';")"
echo "row_count=$ROW_COUNT"

psql_exec -c "delete from orders where channel = '${CHANNEL}' and \"channelAccountId\" = '${ACCOUNT_ID}' and \"externalOrderId\" = '${EXTERNAL_ID}';"
rm -f "$OUT1" "$OUT2"

if [ "$ROW_COUNT" != "1" ]; then
  echo "expected one surviving row, got $ROW_COUNT" >&2
  exit 1
fi

if [ "$STATUS1" -eq 0 ] && [ "$STATUS2" -ne 0 ]; then
  echo "live idempotency index verification ok"
  exit 0
fi

if [ "$STATUS2" -eq 0 ] && [ "$STATUS1" -ne 0 ]; then
  echo "live idempotency index verification ok"
  exit 0
fi

echo "expected exactly one insert to fail on duplicate key" >&2
exit 1
