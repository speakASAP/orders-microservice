# Agents: orders-microservice


## Knowledge Retrieval (query before reading files)
Query the RAG service first to reuse indexed ecosystem context before reading raw files:

```bash
curl -s -X POST http://docs-rag-microservice.statex-apps.svc.cluster.local:3397/retrieval/agent-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR QUESTION HERE", "maxTokens": 3000}'
```

- Internal URL: `http://docs-rag-microservice.statex-apps.svc.cluster.local:3397`
- Public URL: `https://docs-rag.alfares.cz`
- Full guide: `docs-rag-microservice/docs/RAG_USAGE.md`

Data service — no AI agent coordination.

## Goalkeeper Orchestrator Workflow

The local goalkeeper application acts as the implementation orchestrator around this project, while `orders-microservice` remains a data service.

- The goalkeeper tracks active goals, sets or updates implementation goals, maintains plans, and records progress across runs.
- When the user communicates through command line or chat, the orchestrator response should state what was completed during the last run and what concrete next step is needed.
- Keep this project documentation synchronized when the orchestrator rules or operating approach changes.
- Every assistant response in this project context must end with a final line beginning `Next step:`. Use a specific next action when work remains, or `Next step: No action needed.` when the task is complete.

## Active Agents
<!-- Coordinator-maintained -->
None.
