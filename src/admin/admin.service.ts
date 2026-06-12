import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../orders/order.entity';
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

const SOURCE_CATALOG: Record<string, { application: string; service: string }> = {
  flipflop: { application: 'FlipFlop Storefront', service: 'flipflop-service' },
  allegro: { application: 'Allegro Marketplace', service: 'allegro-service' },
  aukro: { application: 'Aukro Marketplace', service: 'aukro-service' },
  bazos: { application: 'Bazos Classifieds', service: 'bazos-service' },
  heureka: { application: 'Heureka Marketplace', service: 'heureka-service' },
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
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
        method: order.paymentMethod || 'unknown',
        status: order.paymentStatus || 'unknown',
      },
      shipping: {
        method: order.shippingMethod || 'unknown',
        shipments: shipments.map((shipment) => ({
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber || null,
          trackingUrl: shipment.trackingUrl || null,
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
      paymentStatus: order.paymentStatus || 'unknown',
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
      name: order.customer?.name || 'Unknown customer',
      email: order.customer?.email || null,
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
    if (order.customer?.name) return order.customer.name;
    if (order.customer?.email) return order.customer.email;
    return 'Unknown customer';
  }

  private getLogIndicators(order: Order): string[] {
    const indicators = ['created', `state:${order.status}`];
    if (order.paymentStatus) indicators.push(`payment:${order.paymentStatus}`);
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
        detail: `${shipment.carrier}${shipment.trackingNumber ? ` / ${shipment.trackingNumber}` : ''}`,
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
}
