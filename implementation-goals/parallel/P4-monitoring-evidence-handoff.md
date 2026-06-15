# P4 Monitoring Evidence Handoff - Orders Managed Warehouse Reservation Handoff

Date: 2026-06-13
Lane: P4 Normal traffic monitoring evidence
Owner role: Parallel observation agent
Remote repository: `/home/ssf/Documents/Github/orders-microservice`
Allowed file changed: `implementation-goals/parallel/P4-monitoring-evidence-handoff.md`

## Intent Preservation Chain

- Vision: Orders remains the canonical order lifecycle service while Warehouse remains stock and reservation authority.
- Goal Impact: Collect safe post-deploy monitoring evidence for managed Orders-to-Warehouse reservation handoff without changing runtime behavior.
- System: `orders-microservice` in Kubernetes namespace `statex-apps`.
- Feature: Managed Warehouse reservation handoff enabled by runtime config and Vault-backed secret projection.
- Task: Observe health, deployment/pod status, safe recent logs, restarts, events, and relevant errors.
- Execution Plan: Read-only remote checks only; no deploy, no config changes, no secret values, no raw customer data, no full payload logs.
- Coding Prompt: N/A, observation-only lane.
- Code: No runtime, manifest, package, source, or shared IPS docs changed.
- Validation: Sensitive literal scan and `git diff --check` run after writing this handoff.

## Summary

- Live health: PASS. `https://orders.alfares.cz/health` returned HTTP 200 and `{"status":"healthy","service":"orders-microservice"}` at `2026-06-13T21:08:43.524Z`.
- Kubernetes deployment: PASS. `deployment/orders-microservice` is rolled out with `1/1` ready, updated, and available replica.
- Pod state: PASS. Active pod `orders-microservice-6f797c7cf9-rzc5z` is `Running`, app container ready, app restart count `0`.
- Deployed image: `localhost:5000/orders-microservice:634d570`, image digest `sha256:7c50721a35a759a12637a8053e6ff7035003fc6e8607cdfbd66d34d2a8bf8e5b`.
- Managed Warehouse handoff runtime config: PASS for enabled flag, Warehouse URL, and token presence without printing the token value.
- Recent safe application logs: two sanitized successful `order.create` audit entries in the last four hours; no Warehouse reservation/handoff log lines observed in that window.
- Restarts/events: No pod events from `kubectl describe`; app restart count `0`.
- Relevant warning/error: one `Failed to connect to RabbitMQ` line appears immediately before `Nest application successfully started` in recent logs. No later RabbitMQ failure lines were observed in the sampled last-four-hour log output.

## Evidence Details

### Live Health

Command:

```bash
ssh alfares 'curl -sS -i https://orders.alfares.cz/health | sed -n "1,20p"'
```

Result summary:

- HTTP status: `HTTP/2 200`
- Body: `{"status":"healthy","service":"orders-microservice","uptime":11232,"timestamp":"2026-06-13T21:08:43.524Z"}`
- No secret values printed.

### Kubernetes Deployment And Pod Status

Commands:

```bash
ssh alfares 'kubectl -n statex-apps get deployment orders-microservice -o wide && kubectl -n statex-apps rollout status deployment/orders-microservice --timeout=30s && kubectl -n statex-apps get pods -l app=orders-microservice -o wide'
ssh alfares 'kubectl -n statex-apps describe pod -l app=orders-microservice | sed -n "/^Name:/,/^Events:/p" | sed -E "s/(Token:|Secret:|Password:).*/\1 [REDACTED]/I"; kubectl -n statex-apps get events --sort-by=.lastTimestamp --field-selector involvedObject.kind=Pod | grep orders-microservice | tail -n 20'
```

Result summary:

- Deployment `orders-microservice`: `READY 1/1`, `UP-TO-DATE 1`, `AVAILABLE 1`, age `48d`.
- Rollout status: `deployment "orders-microservice" successfully rolled out`.
- Active pod: `orders-microservice-6f797c7cf9-rzc5z`, `READY 1/1`, `STATUS Running`, `RESTARTS 0`, age `3h10m` at observation time.
- Pod app container started `Sat, 13 Jun 2026 20:01:03 +0200`; `Ready: True`; `Restart Count: 0`.
- Init containers `wait-postgres`, `wait-auth`, and `wait-logging` completed with exit code `0`.
- `Events: <none>` in pod describe output.

### Service And Ingress

Command:

```bash
ssh alfares 'kubectl -n statex-apps get ingress orders-microservice -o jsonpath="{.spec.rules[*].host}"; printf "\n"; kubectl -n statex-apps get svc orders-microservice -o wide'
```

Result summary:

- Ingress host: `orders.alfares.cz`.
- Service: `orders-microservice`, `ClusterIP 10.43.128.228`, port `3203/TCP`, selector `app=orders-microservice`.

### Managed Warehouse Handoff Runtime Config

Command:

```bash
ssh alfares 'printf "WAREHOUSE_RESERVATION_ENABLED="; kubectl -n statex-apps get configmap orders-microservice-config -o jsonpath="{.data.WAREHOUSE_RESERVATION_ENABLED}"; printf "\nWAREHOUSE_SERVICE_URL="; kubectl -n statex-apps get configmap orders-microservice-config -o jsonpath="{.data.WAREHOUSE_SERVICE_URL}"; printf "\nWAREHOUSE_RESERVATION_TTL_SECONDS="; kubectl -n statex-apps get configmap orders-microservice-config -o jsonpath="{.data.WAREHOUSE_RESERVATION_TTL_SECONDS}"; printf "\nWAREHOUSE_SERVICE_TOKEN_PRESENT="; if kubectl -n statex-apps get secret orders-microservice-secret -o jsonpath="{.data.WAREHOUSE_SERVICE_TOKEN}" | grep -q .; then printf "yes-redacted"; else printf "no"; fi; printf "\n"'
```

Result summary:

- `WAREHOUSE_RESERVATION_ENABLED=true`
- `WAREHOUSE_SERVICE_URL=http://warehouse-microservice.statex-apps.svc.cluster.local:3201`
- `WAREHOUSE_SERVICE_TOKEN_PRESENT=yes-redacted`
- `WAREHOUSE_RESERVATION_TTL_SECONDS=` is empty or not set in the observed ConfigMap. Marked `[MISSING: explicit runtime WAREHOUSE_RESERVATION_TTL_SECONDS value]`.
- Secret value was not printed.

### Recent Safe Log Samples

Commands:

```bash
ssh alfares 'kubectl -n statex-apps logs deployment/orders-microservice --since=4h --tail=1000 | sed -E "s/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[UUID]/g; s/(Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/g; s/(token|secret|password)([^[:space:]]*)/\1[REDACTED]/Ig" | grep -Ei "error|exception|fail|warehouse|reservation|handoff|order.create|healthy|started|listening" | tail -n 80'
ssh alfares 'kubectl -n statex-apps logs deployment/orders-microservice --since=4h --tail=1000 | awk '\''BEGIN{total=0; errors=0; warehouse=0; handoff=0; create=0} {total++; l=tolower($0); if (l ~ /error|exception|unhandled|panic|failed/) errors++; if (l ~ /warehouse|reservation/) warehouse++; if (l ~ /handoff/) handoff++; if (l ~ /order.create/) create++} END{printf "total_lines=%d\nerror_exception_failed_lines=%d\nwarehouse_reservation_lines=%d\nwarehouse_handoff_lines=%d\norder_create_lines=%d\n", total, errors, warehouse, handoff, create}'\'''
ssh alfares 'kubectl -n statex-apps logs deployment/orders-microservice --since=4h --tail=1000 | nl -ba | grep -Ei "rabbitmq|error|exception|failed|started|order.create" | sed -E "s/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[UUID]/g; s/(Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/g; s/(token|secret|password)([^[:space:]]*)/\1[REDACTED]/Ig" | tail -n 40'
```

Result summary:

- Sampled last-four-hour logs: `total_lines=67`.
- `error_exception_failed_lines=1`; line was `Failed to connect to RabbitMQ`.
- `warehouse_reservation_lines=0`.
- `warehouse_handoff_lines=0`.
- `order_create_lines=2`.
- Safe redacted samples:
  - `Failed to connect to RabbitMQ`
  - `06/13/2026, 6:01:33 PM [NestApplication] Nest application successfully started`
  - `2026-06-13T18:03:24.904Z [OrdersService] AUDIT {"operation":"order.create","resourceType":"order","resourceId":"[UUID]","channel":"flipflop","resultingStatus":"pending","outcome":"success","durationMs":673,"processed":1}`
  - `2026-06-13T19:18:56.783Z [OrdersService] AUDIT {"operation":"order.create","resourceType":"order","resourceId":"[UUID]","channel":"flipflop","resultingStatus":"pending","outcome":"success","durationMs":909,"processed":1}`

## Unavailable Or Limited Facts

- `[MISSING: RAG context]` The required pre-read RAG query was attempted against the internal RAG service from the remote environment, but the request exited with code `6` and no usable body was returned.
- `[MISSING: explicit runtime WAREHOUSE_RESERVATION_TTL_SECONDS value]` The observed ConfigMap query returned an empty value for `WAREHOUSE_RESERVATION_TTL_SECONDS`.
- `[UNKNOWN: whether no Warehouse handoff log lines means no eligible traffic occurred]` The sampled application logs contained successful order creation audit lines but no Warehouse reservation/handoff lines. This observation is log-sample-only and does not inspect database rows or Warehouse service state.
- `[UNKNOWN: RabbitMQ broker-side state]` This lane did not inspect RabbitMQ pods or broker logs because the objective was Orders monitoring evidence and safe Orders logs. Orders app became healthy after the startup failure line.

## Validation

Validation commands run after remote copy:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && awk '\''BEGIN{fenced=0} /^```/{fenced=!fenced; next} !fenced{print}'\'' implementation-goals/parallel/P4-monitoring-evidence-handoff.md | rg -n "Bearer [A-Za-z0-9._-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|-----BEGIN|password\s*[:=]\s*[^\s\]]+|secret\s*[:=]\s*[^\s\]]+|token\s*[:=]\s*[^\s\]]+" - || true'
ssh alfares 'cd /home/ssf/Documents/Github/orders-microservice && git diff --check -- implementation-goals/parallel/P4-monitoring-evidence-handoff.md'
```

Result summary:

- Sensitive literal scan: pass; no matches outside fenced command blocks.
- `git diff --check`: pass; no output.

## Coordinator Handoff

- Integrate this lane by reviewing only `implementation-goals/parallel/P4-monitoring-evidence-handoff.md`.
- Do not infer Warehouse handoff side effects from this lane beyond runtime config presence and log sampling. The logs did not show handoff calls in the sampled window.
- Recommended coordinator follow-up: decide whether the startup `Failed to connect to RabbitMQ` line needs separate RabbitMQ/event-publisher observation, and whether the missing explicit Warehouse reservation TTL value is acceptable because code/config defaults apply.
