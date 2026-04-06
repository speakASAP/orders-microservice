# System: orders-microservice

## Architecture

NestJS + PostgreSQL. Multi-channel order ingestion + fulfillment tracking.

- Events published: `order.created`, `order.updated`, `order.shipped` → RabbitMQ
- State machine: pending → confirmed → processing → shipped → delivered | cancelled

## Integrations

| Dependency | URL |
|-----------|-----|
| database-server | db-server-postgres:5432 |
| logging-microservice | logging-microservice:3367 |
| RabbitMQ | order events |

## Current State
<!-- AI-maintained -->
Stage: production

## Known Issues
<!-- AI-maintained -->
- None
