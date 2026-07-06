import { Injectable } from '@nestjs/common';
import { OrderReservationCorrelationBusinessHealthEnvelope } from './business-health.types';

const CONTRACT_ID = 'orders.order_reservation_correlation_business_health.v1' as const;
const BUSINESS_HEALTH_CONTRACT = 'stock-order-marketplace-business-health.v1' as const;
const SERVICE_NAME = 'orders-microservice' as const;
const ENDPOINT = '/api/business-health/order-reservation-correlation' as const;

@Injectable()
export class BusinessHealthService {
  getOrderReservationCorrelationEnvelope(): OrderReservationCorrelationBusinessHealthEnvelope {
    return {
      contractId: CONTRACT_ID,
      businessHealthContract: BUSINESS_HEALTH_CONTRACT,
      service: SERVICE_NAME,
      endpoint: ENDPOINT,
      generatedAt: new Date().toISOString(),
      status: 'warn',
      mutatesOrders: false,
      mutatesWarehouse: false,
      mutatesPayments: false,
      mutatesMarketplace: false,
      runtimeDataQueried: false,
      productionDbQueried: false,
      liveSyntheticMutationAuthorized: false,
      summary:
        'Orders source contract has a sellable-channel reservation gate before order acceptance evidence is emitted; live order/reservation proof remains runtime-packet gated.',
      sourceRefs: [
        {
          path: 'src/orders/orders.service.ts',
          purpose: 'Order create flow calls WarehouseReservationClient reserve handoff, asserts reserved handoff for sellable channels, stores warehouseHandoff, then publishes created/lifecycle events.',
        },
        {
          path: 'src/warehouse/warehouse-reservation.client.ts',
          purpose: 'Outbound Warehouse reservation client owns reserve/release/fulfill/cancel/expire/return payload surfaces and sanitized handoff summary.',
        },
        {
          path: 'scripts/verify-order-reservation-gate.js',
          purpose: 'Static/unit-style verifier proves reserved handoff commits and disabled/skipped/failed handoffs roll back without created events.',
        },
        {
          path: 'scripts/verify-warehouse-handoff-contract.js',
          purpose: 'Verifier proves Warehouse reservation payloads, lifecycle actions, compensation, and service JWT header handling.',
        },
        {
          path: 'docs/orchestrator/WAREHOUSE_HANDOFF_CONTRACT.md',
          purpose: 'Source-owned reservation handoff contract preserving Warehouse as stock/reservation authority.',
        },
        {
          path: 'docs/orchestrator/2026-07-06-orders-business-health-handoff.md',
          purpose: 'Focused Orders business-health handoff for order-reservation correlation.',
        },
      ],
      assertions: [
        {
          id: 'orders.create.reserve-before-acceptance.source-gate',
          status: 'warn',
          evidence:
            'orders.service.ts creates draft order/items inside a transaction, calls warehouseReservations reserve handoff, requires handoff.status reserved for sellable channels, then stores warehouseHandoff before event publication.',
        },
        {
          id: 'orders.create.sellable-channel.requirement',
          status: 'warn',
          evidence:
            'assertRequiredWarehouseReservation delegates to requiresWarehouseReservation and rejects sellable channels unless Warehouse handoff status is reserved.',
        },
        {
          id: 'orders.create.idempotent-replay.no-duplicate-reservation',
          status: 'warn',
          evidence:
            'Existing idempotency lookup returns a matching existing order before the create transaction and before Warehouse reservation is attempted.',
        },
        {
          id: 'orders.lifecycle.release-fulfill-cancel-surfaces',
          status: 'warn',
          evidence:
            'WarehouseReservationClient exposes release, fulfill, cancel, expire, and return action surfaces for expire/return lifecycle handoff surfaces.',
        },
        {
          id: 'business-health.endpoint.read-only-source-only',
          status: 'warn',
          evidence:
            'This envelope is static source evidence only: runtimeDataQueried=false, productionDbQueried=false, liveSyntheticMutationAuthorized=false, and all mutation flags are false.',
        },
      ],
      blockers: [
        '[MISSING: approved live Orders/Warehouse runtime evidence packet for target order/product/channel]',
        '[MISSING: exact target order/product/channel and warehouse reservation lookup scope for live correlation proof]',
        '[MISSING: approved cleanup/payment/provider boundary packet if the runtime proof creates or cancels a real order]',
        '[MISSING: owner-approved schedule and actor for synthetic order create/replay/cancel runtime evidence]',
      ],
      intentPreservation: {
        vision:
          'A paid customer order must not be accepted as sellable unless stock reservation authority can prove the item is reserved for that order.',
        goalImpact:
          'Business health can see that Orders owns the order/reservation correlation source contract before any live synthetic order mutation is approved.',
        system:
          'Orders owns canonical order lifecycle and correlation metadata; Warehouse owns stock, reservation rows, availability, expiry, fulfillment, cancellation reversal, and return authority.',
        feature:
          'Orders service-owned read-only business-health evidence envelope for reservation-before-order-acceptance.',
        task:
          'Expose a public read-only source envelope at GET /api/business-health/order-reservation-correlation without DB reads or runtime mutations.',
        executionPlan:
          'Add BusinessHealthModule, controller, service, typed envelope, static verifier, and focused handoff documentation; preserve live runtime blockers.',
        codingPrompt:
          'Implement source-only order-reservation correlation evidence and prove forbidden mutation/query patterns are absent from the business-health endpoint surface.',
        code:
          'src/business-health/**, src/app.module.ts, package.json, scripts/verify-business-health-orders-reservation-contract.js, docs/orchestrator/2026-07-06-orders-business-health-handoff.md',
        validation:
          'npm run verify:business-health-orders-reservation-contract; npm run build; git diff --check',
      },
    };
  }
}
