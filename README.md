# orders-microservice

Central order processing service. Handles orders from all sales channels.

## Quick Reference

| | |
|---|---|
| Port | 3203 · `http://orders-microservice:3203` |
| Domain | `https://orders.alfares.cz` |
| Stack | NestJS · PostgreSQL · RabbitMQ |
| Health | `curl http://orders-microservice:3203/health` |
| Deploy | `./scripts/deploy.sh` |
| Logs | `kubectl logs -n statex-apps -l app=orders-microservice -f` |

## API Endpoints

### Orders

| Method | Path | Description |
|---|---|---|
| GET | `/api/orders` | List orders (filter: channel, status) |
| GET | `/api/orders/:id` | Order detail |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Update order status |

### Items

| Method | Path | Description |
|---|---|---|
| GET | `/api/items/order/:orderId` | List order items |
| POST | `/api/items/order/:orderId` | Add item |
| PUT | `/api/items/:id/fulfillment` | Update fulfillment status |

### Shipments

| Method | Path | Description |
|---|---|---|
| GET | `/api/shipments/order/:orderId` | List shipments |
| POST | `/api/shipments` | Create shipment |
| PUT | `/api/shipments/:id/tracking` | Update tracking |
| PUT | `/api/shipments/:id/status` | Update shipment status |

### Pricing (AI suggestions)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/pricing/suggestions` | List suggestions |
| POST | `/admin/pricing/generate` | Generate suggestions |
| PATCH | `/admin/pricing/suggestions/:id/approve` | Approve |
| PATCH | `/admin/pricing/suggestions/:id/reject` | Reject |

### Health

`GET /health`

## Infrastructure

- **K8s**: `statex-apps` namespace · k3s ✅
- **Secrets**: Vault `secret/prod/orders-microservice` → ESO → K8s Secret
  See [`../shared/docs/VAULT.md`](../shared/docs/VAULT.md)

## Related Services

| Service | Internal URL |
|---|---|
| catalog-microservice | `catalog-microservice:3200` |
| warehouse-microservice | `warehouse-microservice:3201` |
| allegro-service | `allegro-service:3403` |
| flipflop-service | `flipflop-service:3000` |
| auth-microservice | `auth-microservice:3370` |
