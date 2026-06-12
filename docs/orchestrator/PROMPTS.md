# Orders Goal Prompts

Use these prompts when the owner asks to continue Orders intent-preservation work.

## Universal Session Prompt

Read `AGENTS.md`, `BUSINESS.md`, `SYSTEM.md`, `README.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, `implementation-goals/README.md`, and all files in `docs/orchestrator/`. Query docs-rag-microservice for the selected Orders topic when ecosystem architecture or contract context is needed. Identify the active checkpoint from `docs/IMPLEMENTATION_STATE.md`; otherwise identify the earliest active or pending chunk. Restate the preserved Orders intent and the ownership boundaries affected by the chunk. Refresh the context package, invariants, execution plan, and pre-coding gate before coding. Implement only that chunk, verify it, update `docs/IMPLEMENTATION_STATE.md`, append status evidence, and leave the next chunk clearly named.

## Goal 2 Prompt

Implement the next unfinished chunk of "Goal 2 - Order Contract And State Machine Hardening." Preserve Orders as canonical order lifecycle owner. Enforce valid status transitions. Do not automate cancellations, refunds, or destructive corrections without explicit owner approval.

## Goal 3 Prompt

Implement the next unfinished chunk of "Goal 3 - Sensitive Customer Data And Audit Safety." Make writes and status changes observable without logging customer addresses, payment details, tokens, secrets, or raw production customer data.

## Goal 4 Prompt

Implement the next unfinished chunk of "Goal 4 - Channel Order Ingestion Contract." Keep FlipFlop and marketplace services as clients of Orders. Define idempotent create/forward behavior without duplicating canonical order records in channel services.

## Goal 5 Prompt

Implement the next unfinished chunk of "Goal 5 - Warehouse, Payment, And Event Boundary Alignment." Coordinate stock, payment status, shipments, notifications, leads, and marketing through contracts while keeping each owning service responsible for its domain.

## Goal 6 Prompt

Implement the next unfinished chunk of "Goal 6 - Pricing Suggestion Safety And Consolidation." Keep AI pricing suggestions human-approved and bounded. Do not move payment capture or payment identity into Orders.
