# Business: orders-microservice
>
> ⚠️ IMMUTABLE BY AI.

## Goal

Central order processing from all sales channels. Order status management and shipment tracking.

## Constraints

- AI must never cancel or refund orders without explicit human approval
- Order status transitions must follow defined state machine
- Sensitive customer data (address, payment) must never be logged

## Consumers

flipflop-service, allegro-service, aukro-service, bazos-service, marketing-microservice.

## SLA

- Port: 3203 (<http://orders-microservice:3203>)
- Production: <https://orders.alfares.cz>
- Events: `order.created`, `order.updated`, `order.shipped` → RabbitMQ
