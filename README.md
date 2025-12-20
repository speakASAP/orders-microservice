# Order Microservice

Central order processing service - handles orders from all sales channels.

## Port: 3203 (orders.statex.cz)

## API Endpoints

### Orders

- `GET /api/orders` - List orders (filter by channel, status)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Items

- `GET /api/items/order/:orderId` - Get order items
- `POST /api/items/order/:orderId` - Add item to order
- `PUT /api/items/:id/fulfillment` - Update fulfillment status

### Shipments

- `GET /api/shipments/order/:orderId` - Get order shipments
- `POST /api/shipments` - Create shipment
- `PUT /api/shipments/:id/tracking` - Update tracking info
- `PUT /api/shipments/:id/status` - Update shipment status

### Health

- `GET /health` - Health check

## RabbitMQ Events

Publishes to `orders.events` exchange:

- `order.created` - New order created
- `order.updated` - Order status changed
- `order.shipped` - Order shipped

## Related Services

- `catalog-microservice` (3200) - Product info
- `warehouse-microservice` (3201) - Stock reservation
- `allegro-service` (34xx) - Allegro orders
- `flipflop-service` (35xx) - FlipFlop orders
