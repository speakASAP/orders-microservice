import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusApprovalInput } from '../orders/status-transitions';
import { Shipment } from '../shipments/shipment.entity';

type SourceMeta = {
  application: string;
  service: string;
  channel: string;
  accountId: string | null;
  externalOrderId: string | null;
};

type OrderFilters = {
  application?: string;
  service?: string;
  state?: string;
  status?: string;
  channel?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: string;
};

type IdempotencyDiagnosticFilters = {
  contractVersion?: string;
  channel?: string;
  channelAccountId?: string;
  externalOrderId?: string;
};

type AdminActor = {
  sub?: string;
  email?: string;
  roles?: string[];
};

type AdminOrderStatusActionInput = {
  orderId?: string;
  status?: string;
  approval?: OrderStatusApprovalInput;
};

const ORDER_CREATE_CONTRACT_VERSION = 'orders.create.v1';
export const ADMIN_READ_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:admin',
  'internal:orders-microservice:readonly',
  'internal:orders-microservice:operator',
] as const;
export const ADMIN_ACTION_ROLES = [
  'global:superadmin',
  'internal:orders-microservice:action-admin',
] as const;

const SOURCE_CATALOG: Record<string, { application: string; service: string }> = {
  flipflop: { application: 'FlipFlop Storefront', service: 'flipflop-service' },
  allegro: { application: 'Allegro Marketplace', service: 'allegro-service' },
  aukro: { application: 'Aukro Marketplace', service: 'aukro-service' },
  bazos: { application: 'Bazos Classifieds', service: 'bazos-service' },
  heureka: { application: 'Heureka Marketplace', service: 'heureka-service' },
  cliplot: { application: 'Cliplot Storefront', service: 'cliplot' },
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    private readonly ordersService: OrdersService,
  ) {}

  async getDashboard(filters: OrderFilters) {
    const limit = this.normalizeLimit(filters.limit);
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .orderBy('order.createdAt', 'DESC')
      .take(limit);

    this.applyFilters(query, filters);

    const [orders, totalMatching] = await query.getManyAndCount();
    const allOrders = await this.orderRepository.find({ select: ['channel', 'status'] });
    const summaries = orders.map((order) => this.serializeOrderSummary(order));

    return {
      filters: this.getFilterOptions(allOrders),
      metrics: this.getMetrics(allOrders, summaries, totalMatching),
      orders: summaries,
      totalMatching,
      limit,
      generatedAt: new Date().toISOString(),
    };
  }

  async getOrderDetail(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const shipments = await this.shipmentRepository.find({
      where: { orderId: id },
      order: { createdAt: 'DESC' },
    });

    const summary = this.serializeOrderSummary(order);
    const timeline = this.buildTimeline(order, shipments);

    return {
      summary,
      source: this.getSourceMeta(order),
      customer: this.serializeCustomer(order),
      totals: this.serializeTotals(order),
      payment: {
        method: order.paymentMethod ? 'recorded' : 'unknown',
        status: order.paymentStatus ? 'recorded' : 'unknown',
      },
      shipping: {
        method: order.shippingMethod || 'unknown',
        shipments: shipments.map((shipment) => ({
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: this.maskTrackingValue(shipment.trackingNumber),
          trackingUrl: null,
          trackingUrlPresent: Boolean(shipment.trackingUrl),
          status: shipment.status,
          shippedAt: this.toIso(shipment.shippedAt),
          deliveredAt: this.toIso(shipment.deliveredAt),
          createdAt: this.toIso(shipment.createdAt),
          updatedAt: this.toIso(shipment.updatedAt),
        })),
      },
      items: (order.items || []).map((item) => ({
        id: item.id,
        productId: item.productId,
        sku: item.sku || null,
        title: item.title,
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unitPrice),
        totalPrice: this.toNumber(item.totalPrice),
        fulfillmentStatus: item.fulfillmentStatus,
        warehouseId: item.warehouseId || null,
      })),
      timeline,
      logs: this.buildSafeLogs(order, shipments, timeline),
      notes: {
        hasCustomerNote: Boolean(order.customerNote),
        hasInternalNote: Boolean(order.internalNote),
      },
    };
  }

  async getOperationsOverview(actor: AdminActor = {}) {
    const orders = await this.orderRepository.find({
      select: ['id', 'channel', 'channelAccountId', 'externalOrderId', 'status', 'paymentStatus', 'warehouseHandoff', 'updatedAt'],
    });
    const shipmentCount = await this.shipmentRepository.count();
    const now = Date.now();
    const openStates = new Set(['pending', 'confirmed', 'processing']);
    const staleOpenOrders = orders.filter((order) => {
      if (!openStates.has(order.status)) return false;
      const updatedAt = order.updatedAt ? new Date(order.updatedAt).getTime() : 0;
      return updatedAt > 0 && now - updatedAt > 24 * 60 * 60 * 1000;
    }).length;

    return {
      generatedAt: new Date().toISOString(),
      mode: this.getAdminMode(actor),
      integrations: this.getIntegrationHealth(orders, shipmentCount),
      idempotency: this.getIdempotencySummary(orders),
      lifecycle: {
        openOrders: orders.filter((order) => openStates.has(order.status)).length,
        staleOpenOrders,
        paidOrders: orders.filter((order) => order.paymentStatus === 'paid').length,
        shipmentRecords: shipmentCount,
        warehouseHandoffs: orders.filter((order) => Boolean(order.warehouseHandoff)).length,
      },
    };
  }

  getActionCatalog(actor: AdminActor = {}) {
    const mode = this.getAdminMode(actor);
    return {
      generatedAt: new Date().toISOString(),
      mode,
      workflows: [
        {
          id: 'order.status.update',
          enabled: mode.canRunActions,
          resourceType: 'order',
          allowedStatuses: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
          approvalRequiredFor: ['cancelled'],
          approval: {
            approvalType: 'human',
            requiredSideEffects: ['payment', 'warehouse', 'notification', 'crm', 'channel'],
            reasonCode: '3-80 uppercase letters, numbers, underscores, or hyphens',
          },
          boundary: 'Delegates to OrdersService.updateStatus and the existing order state-machine validator.',
        },
      ],
    };
  }

  async applyOrderStatusAction(input: AdminOrderStatusActionInput, actor: AdminActor = {}) {
    const mode = this.getAdminMode(actor);
    if (!mode.canRunActions) {
      throw new ForbiddenException('Orders admin action role is required for lifecycle mutations');
    }

    const orderId = input.orderId?.trim();
    const status = input.status?.trim();
    if (!orderId || !status) {
      throw new BadRequestException('orderId and status are required for admin order status actions');
    }

    const updated = await this.ordersService.updateStatus(orderId, status, {
      approval: input.approval,
      actor,
    });

    return {
      success: true,
      action: {
        workflow: 'order.status.update',
        resourceType: 'order',
        resourceId: updated.id,
        requestedStatus: status,
        resultingStatus: updated.status,
        approvalRequired: status.toLowerCase() === 'cancelled',
        actorMode: mode.name,
      },
      order: this.serializeOrderSummary(updated),
    };
  }

  async getIdempotencyDiagnostics(filters: IdempotencyDiagnosticFilters) {
    const contractVersion = (filters.contractVersion || ORDER_CREATE_CONTRACT_VERSION).trim();
    if (contractVersion !== ORDER_CREATE_CONTRACT_VERSION) {
      throw new BadRequestException(`Unsupported order create contract version: ${contractVersion}`);
    }

    const channel = filters.channel?.trim().toLowerCase();
    const externalOrderId = filters.externalOrderId?.trim();
    const channelAccountId = filters.channelAccountId?.trim();
    if (!channel || !externalOrderId) {
      throw new BadRequestException('channel and externalOrderId are required for idempotency diagnostics');
    }

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('LOWER(order.channel) = :channel', { channel })
      .andWhere('order.externalOrderId = :externalOrderId', { externalOrderId })
      .orderBy('order.createdAt', 'DESC')
      .take(25);

    if (channelAccountId !== undefined) {
      query.andWhere("COALESCE(order.channelAccountId, '') = :channelAccountId", { channelAccountId });
    }

    const matches = await query.getMany();
    const accountScopes = Array.from(new Set(matches.map((order) => order.channelAccountId || ''))).sort();

    return {
      contractVersion,
      query: {
        channel,
        channelAccountId: channelAccountId || null,
        externalOrderId,
      },
      outcome: matches.length === 0 ? 'not_found' : matches.length === 1 ? 'single_match' : 'multiple_matches',
      duplicateRisk: matches.length > 1,
      accountScopes,
      matches: matches.map((order) => ({
        id: order.id,
        state: order.status,
        source: this.getSourceMeta(order),
        itemCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        total: this.toNumber(order.total),
        currency: order.currency,
        createdAt: this.toIso(order.createdAt),
        updatedAt: this.toIso(order.updatedAt),
      })),
      guidance: matches.length === 0
        ? 'No canonical order exists for this idempotency key.'
        : 'Safe retry should return the existing canonical order without creating new rows or rerunning side effects.',
    };
  }

  private applyFilters(query: SelectQueryBuilder<Order>, filters: OrderFilters) {
    const state = filters.state || filters.status;
    if (state) query.andWhere('order.status = :state', { state });

    const sourceChannels = this.resolveSourceChannels(filters);
    if (sourceChannels.length) {
      query.andWhere('order.channel IN (:...sourceChannels)', { sourceChannels });
    } else if (filters.application || filters.service) {
      query.andWhere('1 = 0');
    }

    if (filters.channel) query.andWhere('order.channel = :channel', { channel: filters.channel });

    if (filters.from) {
      const from = new Date(filters.from);
      if (!Number.isNaN(from.valueOf())) query.andWhere('order.createdAt >= :from', { from });
    }

    if (filters.to) {
      const to = new Date(filters.to);
      if (!Number.isNaN(to.valueOf())) query.andWhere('order.createdAt <= :to', { to });
    }

    if (filters.search) {
      const search = `%${filters.search.trim()}%`;
      query.andWhere(new Brackets((qb) => {
        qb.where('order.id::text ILIKE :search', { search })
          .orWhere('order.externalOrderId ILIKE :search', { search })
          .orWhere('order.channel ILIKE :search', { search })
          .orWhere('order.channelAccountId ILIKE :search', { search });
      }));
    }
  }

  private resolveSourceChannels(filters: OrderFilters): string[] {
    const entries = Object.entries(SOURCE_CATALOG);
    const normalizedApplication = filters.application?.toLowerCase();
    const normalizedService = filters.service?.toLowerCase();

    return entries
      .filter(([, source]) => !normalizedApplication || source.application.toLowerCase() === normalizedApplication)
      .filter(([, source]) => !normalizedService || source.service.toLowerCase() === normalizedService)
      .map(([channel]) => channel);
  }

  private serializeOrderSummary(order: Order) {
    const source = this.getSourceMeta(order);
    const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return {
      id: order.id,
      externalOrderId: order.externalOrderId || null,
      state: order.status,
      status: order.status,
      source,
      customerLabel: this.getCustomerLabel(order),
      total: this.toNumber(order.total),
      currency: order.currency,
      paymentStatus: order.paymentStatus ? 'recorded' : 'unknown',
      shippingMethod: order.shippingMethod || 'unknown',
      itemCount,
      orderedAt: this.toIso(order.orderedAt),
      createdAt: this.toIso(order.createdAt),
      updatedAt: this.toIso(order.updatedAt),
      logIndicators: this.getLogIndicators(order),
    };
  }

  private getSourceMeta(order: Order): SourceMeta {
    const normalized = (order.channel || 'unknown').toLowerCase();
    const mapped = SOURCE_CATALOG[normalized] || {
      application: this.toTitle(`${order.channel || 'unknown'} application`),
      service: `${normalized || 'unknown'}-service`,
    };

    return {
      application: mapped.application,
      service: mapped.service,
      channel: order.channel || 'unknown',
      accountId: order.channelAccountId || null,
      externalOrderId: order.externalOrderId || null,
    };
  }

  private serializeCustomer(order: Order) {
    return {
      name: this.maskName(order.customer?.name),
      email: this.maskEmail(order.customer?.email),
      phonePresent: Boolean(order.customer?.phone),
    };
  }

  private serializeTotals(order: Order) {
    return {
      subtotal: this.toNumber(order.subtotal),
      shippingCost: this.toNumber(order.shippingCost),
      taxAmount: this.toNumber(order.taxAmount),
      total: this.toNumber(order.total),
      currency: order.currency,
    };
  }

  private getCustomerLabel(order: Order): string {
    return order.customer?.name || order.customer?.email
      ? `Customer ${this.shortId(order.id)}`
      : 'Unknown customer';
  }

  private getLogIndicators(order: Order): string[] {
    const indicators = ['created', `state:${order.status}`];
    if (order.paymentStatus) indicators.push('payment:recorded');
    if ((order.items || []).some((item) => item.fulfillmentStatus !== 'pending')) indicators.push('fulfillment');
    return indicators;
  }

  private buildTimeline(order: Order, shipments: Shipment[]) {
    const events = [
      {
        at: this.toIso(order.createdAt),
        type: 'order.created',
        label: 'Order created',
        detail: `Created from ${this.getSourceMeta(order).service}`,
      },
      {
        at: this.toIso(order.updatedAt),
        type: 'order.state',
        label: `Order state: ${order.status}`,
        detail: 'Current state recorded by orders-microservice',
      },
    ];

    for (const shipment of shipments) {
      events.push({
        at: this.toIso(shipment.createdAt),
        type: 'shipment.created',
        label: `Shipment ${shipment.status}`,
        detail: shipment.trackingNumber ? `${shipment.carrier} / tracking recorded` : shipment.carrier,
      });
      if (shipment.shippedAt) {
        events.push({
          at: this.toIso(shipment.shippedAt),
          type: 'shipment.shipped',
          label: 'Shipment picked up',
          detail: shipment.carrier,
        });
      }
      if (shipment.deliveredAt) {
        events.push({
          at: this.toIso(shipment.deliveredAt),
          type: 'shipment.delivered',
          label: 'Shipment delivered',
          detail: shipment.carrier,
        });
      }
    }

    return events
      .filter((event) => event.at)
      .sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }

  private buildSafeLogs(order: Order, shipments: Shipment[], timeline: ReturnType<AdminService['buildTimeline']>) {
    const source = this.getSourceMeta(order);
    const logs = timeline.map((event) => ({
      at: event.at,
      level: 'info',
      source: 'orders-microservice',
      message: event.label,
      context: event.detail,
    }));

    logs.push({
      at: this.toIso(order.updatedAt),
      level: shipments.length ? 'info' : 'warn',
      source: source.service,
      message: shipments.length ? 'Shipment records linked' : 'No shipment record linked yet',
      context: `Order source ${source.application}`,
    });

    return logs.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }

  private getAdminMode(actor: AdminActor = {}) {
    const roles = Array.isArray(actor.roles) ? actor.roles : [];
    const canRunActions = roles.some((role) => ADMIN_ACTION_ROLES.includes(role as typeof ADMIN_ACTION_ROLES[number]));
    const canRead = canRunActions || roles.some((role) => ADMIN_READ_ROLES.includes(role as typeof ADMIN_READ_ROLES[number]));

    return {
      name: canRunActions ? 'action-capable' : 'read-only',
      readOnly: !canRunActions,
      canRead,
      canRunActions,
      actionWorkflowsEnabled: canRunActions,
      allowedReadRoles: [...ADMIN_READ_ROLES],
      actionRolesRequired: [...ADMIN_ACTION_ROLES],
      actionPolicy: canRunActions
        ? 'Action-capable role present. Mutations still delegate to approved Orders workflows and state-machine gates.'
        : 'Default admin mode is read-only. Human-approved mutations require global:superadmin or internal:orders-microservice:action-admin.',
    };
  }

  private getIntegrationHealth(orders: Order[], shipmentCount: number) {
    const channelSet = new Set(orders.map((order) => (order.channel || '').toLowerCase()).filter(Boolean));
    const eventBusConfigured = Boolean(process.env.RABBITMQ_URL);
    return [
      {
        name: 'Auth',
        owner: 'auth-microservice',
        status: process.env.JWT_SECRET ? 'configured' : 'missing_configuration',
        signal: 'JWT role guard protects admin JSON routes',
        evidence: process.env.JWT_SECRET ? 'JWT_SECRET configured' : 'JWT_SECRET missing',
      },
      {
        name: 'Warehouse',
        owner: 'warehouse-microservice',
        status: process.env.WAREHOUSE_RESERVATION_ENABLED === 'true' ? 'enabled' : 'disabled',
        signal: `${orders.filter((order) => Boolean(order.warehouseHandoff)).length} orders have warehouse handoff metadata`,
        evidence: process.env.WAREHOUSE_RESERVATION_ENABLED === 'true' ? 'reservation handoff enabled' : 'reservation handoff disabled',
      },
      {
        name: 'Payments',
        owner: 'payments-microservice',
        status: 'available',
        signal: `${orders.filter((order) => Boolean(order.paymentStatus)).length} orders have bounded payment status`,
        evidence: 'orders.payment-status.v1 callback boundary is present',
      },
      {
        name: 'Catalog',
        owner: 'catalog-microservice',
        status: process.env.PRODUCT_SERVICE_URL || process.env.CATALOG_SERVICE_URL ? 'configured' : 'not_configured',
        signal: 'Product truth remains external; Orders stores order item snapshots only',
        evidence: process.env.PRODUCT_SERVICE_URL || process.env.CATALOG_SERVICE_URL ? 'catalog/product URL configured' : 'catalog/product URL not configured',
      },
      {
        name: 'Notifications',
        owner: 'notifications-microservice',
        status: eventBusConfigured ? 'event_signal_ready' : 'event_signal_local_default',
        signal: 'Consumes versioned order lifecycle events as read-only delivery signals',
        evidence: eventBusConfigured ? 'RabbitMQ URL configured' : 'RabbitMQ default/fallback configuration',
      },
      {
        name: 'Leads',
        owner: 'leads-microservice',
        status: eventBusConfigured ? 'event_signal_ready' : 'event_signal_local_default',
        signal: 'Consumes order events without becoming order truth',
        evidence: `${channelSet.size} source channels observed`,
      },
      {
        name: 'Marketing',
        owner: 'marketing-microservice',
        status: eventBusConfigured ? 'event_signal_ready' : 'event_signal_local_default',
        signal: 'Receives lifecycle events only; no campaign execution happens in Orders',
        evidence: `${shipmentCount} shipment records available for lifecycle context`,
      },
    ];
  }

  private getIdempotencySummary(orders: Order[]) {
    const ordersWithExternalId = orders.filter((order) => Boolean(order.externalOrderId));
    const groups = new Map<string, number>();
    for (const order of ordersWithExternalId) {
      const key = [order.channel || '', order.channelAccountId || '', order.externalOrderId || ''].join('|');
      groups.set(key, (groups.get(key) || 0) + 1);
    }

    return {
      contractVersion: ORDER_CREATE_CONTRACT_VERSION,
      ordersWithExternalId: ordersWithExternalId.length,
      channelAccountScopes: new Set(ordersWithExternalId.map((order) => `${order.channel || 'unknown'}:${order.channelAccountId || 'default'}`)).size,
      duplicateKeyGroups: Array.from(groups.values()).filter((count) => count > 1).length,
      diagnosticInputs: ['channel', 'channelAccountId', 'externalOrderId'],
    };
  }

  private getFilterOptions(orders: Order[]) {
    const sourceValues = orders.map((order) => this.getSourceMeta(order));
    return {
      applications: Array.from(new Set(sourceValues.map((source) => source.application))).sort(),
      services: Array.from(new Set(sourceValues.map((source) => source.service))).sort(),
      states: Array.from(new Set(orders.map((order) => order.status))).sort(),
      channels: Array.from(new Set(orders.map((order) => order.channel))).sort(),
    };
  }

  private getMetrics(allOrders: Order[], summaries: ReturnType<AdminService['serializeOrderSummary']>[], totalMatching: number) {
    const openStates = new Set(['pending', 'confirmed', 'processing']);
    return {
      totalOrders: allOrders.length,
      matchingOrders: totalMatching,
      visibleOrders: summaries.length,
      openOrders: allOrders.filter((order) => openStates.has(order.status)).length,
      shippedOrders: allOrders.filter((order) => order.status === 'shipped').length,
      deliveredOrders: allOrders.filter((order) => order.status === 'delivered').length,
      totalVisibleValue: summaries.reduce((sum, order) => sum + order.total, 0),
    };
  }

  private normalizeLimit(value?: string): number {
    const parsed = Number(value || 100);
    if (!Number.isFinite(parsed)) return 100;
    return Math.min(Math.max(parsed, 1), 250);
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toIso(value?: Date | string | null): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString();
  }

  private toTitle(value: string): string {
    return value
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private shortId(id: string): string {
    return String(id || '').slice(0, 8) || 'unknown';
  }

  private maskName(value?: string | null): string {
    const trimmed = value?.trim();
    if (!trimmed) return 'Unknown customer';
    return trimmed.length <= 2 ? 'Customer **' : `${trimmed[0]}***`;
  }

  private maskEmail(value?: string | null): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const [local, domain] = trimmed.split('@');
    if (!local || !domain) return '[redacted]';
    return `${local[0] || '*'}***@${domain}`;
  }

  private maskTrackingValue(value?: string | null): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const suffix = trimmed.slice(-4);
    return suffix ? `tracking-***${suffix}` : 'tracking-recorded';
  }
}
