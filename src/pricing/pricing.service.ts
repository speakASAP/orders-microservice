import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../logger/logger.service';
import { OrderEventsService } from '../orders/order-events.service';

@Injectable()
export class PricingService {
  private static readonly CONTEXT = 'PricingService';
  private readonly upstreamBaseUrl =
    process.env.ORDERS_PRICING_UPSTREAM_URL ||
    process.env.FLIPFLOP_ORDER_SERVICE_URL ||
    'http://order-service:3203';

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
    private readonly orderEventsService: OrderEventsService,
  ) {}

  async listSuggestions(limit = '50', status = 'pending') {
    return this.forward('GET', '/admin/pricing/suggestions', undefined, {
      limit,
      status,
    });
  }

  async generateSuggestions() {
    return this.forward('POST', '/admin/pricing/generate');
  }

  async approveSuggestion(id: string) {
    const suggestion = await this.forward(
      'GET',
      `/admin/pricing/suggestions/${id}`,
    );

    if (!suggestion) {
      throw new BadRequestException(`Suggestion ${id} not found`);
    }

    const status = String((suggestion as { status?: string }).status || '');
    if (status !== 'pending') {
      throw new BadRequestException(`Suggestion ${id} is already ${status}`);
    }

    const changePercent = Number(
      (suggestion as { changePercent?: number | string }).changePercent || 0,
    );
    if (Math.abs(changePercent) > 30) {
      throw new BadRequestException(
        `Price change of ${changePercent.toFixed(1)}% exceeds the 30% safety limit`,
      );
    }

    const suggestedPrice = Number(
      (suggestion as { suggestedPrice?: number | string }).suggestedPrice,
    );
    if (!Number.isFinite(suggestedPrice) || suggestedPrice <= 0) {
      throw new BadRequestException(
        `Suggestion ${id} has invalid suggestedPrice`,
      );
    }

    this.logger.log(
      `${new Date().toISOString()} approve suggestion applying product price = suggestedPrice value=${suggestedPrice}`,
      PricingService.CONTEXT,
    );

    const approvalResponse = await this.forward(
      'PATCH',
      `/admin/pricing/suggestions/${id}/approve`,
      {
      suggestedPrice,
      },
    );

    await this.orderEventsService.publishPricingPriceChanged({
      productId: String((suggestion as { productId?: string }).productId || ''),
      productName: String(
        (suggestion as { productName?: string }).productName || '',
      ),
      oldPrice: Number(
        (suggestion as { currentPrice?: number | string }).currentPrice || 0,
      ),
      newPrice: Number(
        (suggestion as { suggestedPrice?: number | string }).suggestedPrice || 0,
      ),
      changePercent: Number(
        (suggestion as { changePercent?: number | string }).changePercent || 0,
      ),
      approvedAt: new Date().toISOString(),
      suggestionId: String((suggestion as { id?: string }).id || id),
    });

    this.logger.log(
      `${new Date().toISOString()} published pricing.price_changed event suggestionId=${id}`,
      PricingService.CONTEXT,
    );

    return approvalResponse;
  }

  async rejectSuggestion(id: string) {
    return this.forward('PATCH', `/admin/pricing/suggestions/${id}/reject`);
  }

  private async forward(
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ) {
    const startedAt = Date.now();
    const timestamp = new Date().toISOString();
    const url = `${this.upstreamBaseUrl.replace(/\/$/, '')}${path}`;

    this.logger.log(
      `${timestamp} pricing proxy request started method=${method} path=${path}`,
      PricingService.CONTEXT,
    );

    try {
      const response = await this.httpService.axiosRef.request({
        method,
        url,
        data: body,
        params,
        timeout: 5000,
      });

      this.logger.log(
        `${new Date().toISOString()} pricing proxy request finished method=${method} path=${path} duration_ms=${Date.now() - startedAt}`,
        PricingService.CONTEXT,
      );

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `${new Date().toISOString()} pricing proxy request failed method=${method} path=${path} duration_ms=${Date.now() - startedAt} error=${message}`,
        undefined,
        PricingService.CONTEXT,
      );
      throw new ServiceUnavailableException(
        'Pricing backend unavailable. Product pricing is owned by orders-microservice. Configure ORDERS_PRICING_UPSTREAM_URL during migration.',
      );
    }
  }
}
