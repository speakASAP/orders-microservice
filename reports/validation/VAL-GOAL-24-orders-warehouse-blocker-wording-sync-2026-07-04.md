# Goal 24 Orders Warehouse Blocker Wording Sync - 2026-07-04

Scope: Orders-owned docs/report/verifier only. No live Orders route invocation, payment creation, provider call, refund/reversal, Warehouse reservation/cleanup mutation, channel cleanup, deploy, migration, DB write, secret/token output, raw order/customer/payment/provider data, or Warehouse direct mutation was performed.

## Intent Preservation Chain

- Vision: Goal 24 paid/provider cleanup must keep Orders lifecycle ownership separate from Payments refund state and Warehouse stock ownership.
- Goal Impact: Orders source governance now matches the current Warehouse/Catalog split: candidate component rows/max quantity are source-documented, while live current row readback, renewed execution window/hold duration, and final Warehouse mutation approval remain missing.
- System: Orders owns cancellation actor/reason/idempotency/side-effect acknowledgements and the Orders-to-Warehouse handoff; Payments owns provider/refund evidence; Warehouse owns live stock rows, reservation state, cleanup operation approval, and mutation evidence.
- Feature: Orders paid/provider cleanup approval packet Warehouse blocker wording sync.
- Task: remove the stale combined Warehouse hold/release window/max quantity blocker from current Orders planning docs and make the verifier assert the split blocker.
- Execution Plan: update Orders docs/orchestrator, readiness report, validation report, and static verifier only.
- Coding Prompt: preserve `[MISSING: ...]` blockers; do not infer stock effects from Payments refund state, provider state, Auth token state, or FlipFlop channel state.
- Code: `docs/orchestrator/STATUS.md`, `docs/orchestrator/2026-07-03-goal24-orders-cancel-cleanup-rollback-readiness.md`, `reports/validation/VAL-GOAL-24-orders-paid-provider-bundle-readiness.md`, this report, and `scripts/verify-goal24-paid-provider-bundle-readiness.js`.
- Validation: `node --check scripts/verify-goal24-paid-provider-bundle-readiness.js`, `node scripts/verify-goal24-paid-provider-bundle-readiness.js`, and `git diff --check`.

## Result

[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: deterministic Warehouse component reservation state for cleanup]

Orders may describe the future Warehouse handoff only from Orders lifecycle state plus Warehouse-owned observed component state:

- unpaid pre-completion cancellation: `release` with `PAYMENT_FAILED_RELEASE`.
- paid success: `fulfill` with `PAYMENT_CONFIRMED`.
- completed-transfer refund/reversal/correction cleanup: Orders owner-approved cancellation plus Warehouse `cancel` with `ORDER_CANCELLED` only after provider proof and side-effect acknowledgements exist.
- approved return: Warehouse `return` with `ORDER_RETURNED` only through a separate approved return workflow.
- partial/mixed component state: line-by-line Warehouse-owned cleanup.
- unknown component state: fail-closed no-op until Warehouse owner supplies the observed state and approved operation.

Payments refund state, provider correction notes, local payment metadata, Auth token state, and channel cleanup state are not Warehouse operation selectors.

## Preserved Runtime Blockers

- `[MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof with redacted evidence]`
- `[MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]`
- `[MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]`
- `[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]`
- `[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]`
- `[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]`
- `[MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present]`
- `[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]`

## Parallel Execution

| Workstream | Status | Owner | Scope | Validation | Handoff |
| --- | --- | --- | --- | --- | --- |
| Orders blocker wording sync | ready now | Orders cleanup approval worker | Orders docs/report/verifier only | static verifier + diff check | merge before runtime planning |
| Payments provider evidence | runtime-gated | Payments owner | provider refund/reversal/correction proof and payment hashes | future approved evidence packet | must precede Orders route invocation |
| Warehouse live cleanup approval | runtime-gated | Warehouse owner | live row readback, hold/release duration, final mutation approval | future approved Warehouse evidence packet | must precede any Warehouse cleanup mutation |
| Final integration smoke | final integration | Goal 24 runtime validation owner | paid/provider smoke and cleanup evidence | final redacted evidence path | blocked until all `[MISSING: ...]` facts exist |

Next step: Keep runtime paid/provider cleanup blocked until the remaining owner-approved provider, Orders, Warehouse, channel, and evidence-path facts exist.
