export type BusinessHealthStatus = 'pass' | 'warn' | 'blocked';

export interface BusinessHealthSourceRef {
  path: string;
  purpose: string;
}

export interface BusinessHealthAssertion {
  id: string;
  status: BusinessHealthStatus;
  evidence: string;
}

export interface IntentPreservationChain {
  vision: string;
  goalImpact: string;
  system: string;
  feature: string;
  task: string;
  executionPlan: string;
  codingPrompt: string;
  code: string;
  validation: string;
}

export interface OrderReservationCorrelationBusinessHealthEnvelope {
  contractId: 'orders.order_reservation_correlation_business_health.v1';
  businessHealthContract: 'stock-order-marketplace-business-health.v1';
  service: 'orders-microservice';
  endpoint: '/api/business-health/order-reservation-correlation';
  generatedAt: string;
  status: BusinessHealthStatus;
  mutatesOrders: false;
  mutatesWarehouse: false;
  mutatesPayments: false;
  mutatesMarketplace: false;
  runtimeDataQueried: false;
  productionDbQueried: false;
  liveSyntheticMutationAuthorized: false;
  summary: string;
  sourceRefs: BusinessHealthSourceRef[];
  assertions: BusinessHealthAssertion[];
  blockers: string[];
  intentPreservation: IntentPreservationChain;
}
