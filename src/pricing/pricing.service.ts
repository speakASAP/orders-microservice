import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { OrderEventsService } from '../orders/order-events.service';
import { PriceSuggestion } from './price-suggestion.entity';

type SuggestionResponse = {
  suggestedPrice: number;
  rationale: string;
};

type PricingActor = {
  sub?: string;
  email?: string;
  roles?: string[];
};

@Injectable()
export class PricingService {
  private static readonly CONTEXT = 'PricingService';
  private static readonly MAX_LIMIT = 50;
  private readonly aiServiceUrl =
    process.env.AI_SERVICE_URL || 'http://ai-microservice:3380';
  private readonly productServiceUrl =
    process.env.PRODUCT_SERVICE_URL || process.env.CATALOG_SERVICE_URL || '';

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
    private readonly orderEventsService: OrderEventsService,
    @InjectRepository(PriceSuggestion)
    private readonly priceSuggestionRepository: Repository<PriceSuggestion>,
  ) {}

  async listSuggestions(limit = '50', status = 'pending') {
    const parsedLimit = Number.parseInt(limit, 10);
    const clampedLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), PricingService.MAX_LIMIT)
      : PricingService.MAX_LIMIT;
    const normalizedStatus = status?.trim()
      ? status.trim().toLowerCase()
      : 'pending';

    const [rows, total] = await this.priceSuggestionRepository.findAndCount({
      where: { status: normalizedStatus },
      order: { createdAt: 'DESC' },
      take: clampedLimit,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        currentPrice: Number(row.currentPrice),
        suggestedPrice: Number(row.suggestedPrice),
        changePercent: Number(row.changePercent),
        rationale: row.rationale,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
        approvedBy: row.approvedBy,
        rejectedAt: row.rejectedAt ? row.rejectedAt.toISOString() : null,
        rejectedBy: row.rejectedBy,
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      limit: clampedLimit,
      status: normalizedStatus,
    };
  }

  async generateSuggestions() {
    const startedAt = Date.now();
    const products = await this.loadCandidateProducts();
    let generated = 0;
    let skipped = 0;

    for (const product of products) {
      const productStartedAt = Date.now();
      try {
        const existing = await this.priceSuggestionRepository.findOne({
          where: { productId: product.productId, status: In(['pending', 'approved']) },
          order: { createdAt: 'DESC' },
        });
        if (existing) {
          skipped += 1;
          continue;
        }

        const aiResponse = await this.httpService.axiosRef.post(
          `${this.aiServiceUrl.replace(/\/$/, '')}/ai/complete`,
          {
            tier: 'cheap',
            messages: [
              {
                role: 'user',
                content:
                  `Product: ${product.productName}. Current price: ${product.currentPrice} CZK. ` +
                  `Category: ${product.category}. Suggest an optimal retail price in CZK for a Czech e-commerce platform. ` +
                  'Reply with JSON only: {"suggestedPrice": <number>, "rationale": "<one sentence>"}.',
              },
            ],
            output_schema: { suggestedPrice: 'number', rationale: 'string' },
          },
          { timeout: 5000 },
        );

        const parsed = this.parseAiSuggestion(
          aiResponse.data as Record<string, unknown>,
        );
        if (!parsed) {
          skipped += 1;
          continue;
        }

        const suggestedPrice = parsed.suggestedPrice;
        const changePercent =
          ((suggestedPrice - product.currentPrice) / product.currentPrice) * 100;

        const row = this.priceSuggestionRepository.create({
          productId: product.productId,
          productName: product.productName,
          currentPrice: product.currentPrice,
          suggestedPrice,
          changePercent,
          rationale: parsed.rationale || null,
          status: 'pending',
        });
        await this.priceSuggestionRepository.save(row);
        generated += 1;
      } catch (error) {
        skipped += 1;
        this.logger.error(
          `${new Date().toISOString()} generateSuggestions failed product_id=${product.productId} duration_ms=${Date.now() - productStartedAt} error=${error instanceof Error ? error.message : String(error)}`,
          undefined,
          PricingService.CONTEXT,
        );
      }
    }

    this.logger.log(
      `${new Date().toISOString()} generateSuggestions finished duration_ms=${Date.now() - startedAt} generated=${generated} skipped=${skipped} processed=${products.length}`,
      PricingService.CONTEXT,
    );
    this.logger.audit(
      {
        operation: 'pricing.suggestions.generate',
        resourceType: 'price_suggestion',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        generated,
        skipped,
        processed: products.length,
      },
      PricingService.CONTEXT,
    );

    return { generated, skipped };
  }

  async approveSuggestion(id: string, actor?: PricingActor) {
    const startedAt = Date.now();
    const actorId = this.toSafeActorId(actor);
    const suggestion = await this.priceSuggestionRepository.findOne({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }
    const previousStatus = suggestion.status;
    if (suggestion.status !== 'pending') {
      this.logger.audit(
        {
          operation: 'pricing.suggestion.approve',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'approved',
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      throw new BadRequestException(`Suggestion ${id} is already ${suggestion.status}`);
    }

    const changePercent = Number(suggestion.changePercent || 0);
    if (Math.abs(changePercent) > 30) {
      this.logger.audit(
        {
          operation: 'pricing.suggestion.approve',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'approved',
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      throw new BadRequestException(
        `Price change of ${changePercent.toFixed(1)}% exceeds the 30% safety limit`,
      );
    }

    const suggestedPrice = Number(suggestion.suggestedPrice);
    if (!Number.isFinite(suggestedPrice) || suggestedPrice <= 0) {
      this.logger.audit(
        {
          operation: 'pricing.suggestion.approve',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'approved',
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      throw new BadRequestException(`Suggestion ${id} has invalid suggestedPrice`);
    }

    try {
      await this.updateProductPrice(suggestion.productId, suggestedPrice);

      this.logger.log(
        `${new Date().toISOString()} approve suggestion applying product price = suggestedPrice value=${suggestedPrice}`,
        PricingService.CONTEXT,
      );

      const approvedAt = new Date();
      suggestion.status = 'approved';
      suggestion.approvedAt = approvedAt;
      suggestion.approvedBy = actorId;
      await this.priceSuggestionRepository.save(suggestion);

      await this.orderEventsService.publishPricingPriceChanged({
        productId: suggestion.productId,
        productName: suggestion.productName,
        oldPrice: Number(suggestion.currentPrice || 0),
        newPrice: Number(suggestion.suggestedPrice || 0),
        changePercent,
        approvedAt: approvedAt.toISOString(),
        suggestionId: suggestion.id,
      });

      this.logger.log(
        `${new Date().toISOString()} published pricing.price_changed event suggestionId=${id}`,
        PricingService.CONTEXT,
      );
      this.logger.audit(
        {
          operation: 'pricing.suggestion.approve',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'approved',
          resultingStatus: suggestion.status,
          actorId,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );

      return { success: true, newPrice: suggestedPrice };
    } catch (error) {
      this.logger.audit(
        {
          operation: 'pricing.suggestion.approve',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'approved',
          resultingStatus: suggestion.status,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      throw error;
    }
  }

  async rejectSuggestion(id: string, actor?: PricingActor) {
    const startedAt = Date.now();
    const actorId = this.toSafeActorId(actor);
    const suggestion = await this.priceSuggestionRepository.findOne({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException(`Suggestion ${id} not found`);
    }
    const previousStatus = suggestion.status;
    if (suggestion.status !== 'pending') {
      this.logger.audit(
        {
          operation: 'pricing.suggestion.reject',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'rejected',
          outcome: 'rejected',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      throw new BadRequestException(`Suggestion ${id} is already ${suggestion.status}`);
    }

    try {
      suggestion.status = 'rejected';
      suggestion.rejectedAt = new Date();
      suggestion.rejectedBy = actorId;
      await this.priceSuggestionRepository.save(suggestion);
      this.logger.audit(
        {
          operation: 'pricing.suggestion.reject',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'rejected',
          resultingStatus: suggestion.status,
          actorId,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      return { success: true };
    } catch (error) {
      this.logger.audit(
        {
          operation: 'pricing.suggestion.reject',
          resourceType: 'price_suggestion',
          resourceId: id,
          parentResourceId: suggestion.productId,
          previousStatus,
          requestedStatus: 'rejected',
          resultingStatus: suggestion.status,
          outcome: 'failure',
          durationMs: Date.now() - startedAt,
        },
        PricingService.CONTEXT,
      );
      throw error;
    }
  }

  private toSafeActorId(actor?: PricingActor): string {
    const raw = actor?.sub || actor?.email || 'unknown-admin';
    return String(raw)
      .trim()
      .replace(/[^a-zA-Z0-9@._:-]/g, '_')
      .slice(0, 200) || 'unknown-admin';
  }

  private async loadCandidateProducts(): Promise<
    Array<{
      productId: string;
      productName: string;
      currentPrice: number;
      category: string;
    }>
  > {
    try {
      const rows = await this.priceSuggestionRepository.query(
        `
          SELECT
            oi."productId" AS "productId",
            MAX(oi.title) AS "productName",
            AVG(oi."unitPrice")::double precision AS "currentPrice"
          FROM order_items oi
          GROUP BY oi."productId"
          ORDER BY MAX(oi."createdAt") DESC
          LIMIT $1
        `,
        [PricingService.MAX_LIMIT],
      );
      return rows
        .map((row: Record<string, unknown>) => ({
          productId: String(row.productId || ''),
          productName: String(row.productName || 'Unknown product'),
          currentPrice: Number(row.currentPrice || 0),
          category: 'General',
        }))
        .filter(
          (row) =>
            row.productId.length > 0 &&
            Number.isFinite(row.currentPrice) &&
            row.currentPrice > 0,
        );
    } catch (error) {
      this.logger.error(
        `${new Date().toISOString()} loadCandidateProducts failed error=${error instanceof Error ? error.message : String(error)}`,
        undefined,
        PricingService.CONTEXT,
      );
      return [];
    }
  }

  private parseAiSuggestion(
    data: Record<string, unknown> | null | undefined,
  ): SuggestionResponse | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const direct = this.tryParseSuggestionPayload(data);
    if (direct) {
      return direct;
    }

    const textCandidates: Array<unknown> = [
      (data as { text?: unknown }).text,
      (data as { content?: unknown }).content,
      (data as { result?: unknown }).result,
      (data as { response?: unknown }).response,
    ];

    for (const candidate of textCandidates) {
      if (typeof candidate !== 'string' || !candidate.trim()) {
        continue;
      }
      try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        const fromText = this.tryParseSuggestionPayload(parsed);
        if (fromText) {
          return fromText;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private tryParseSuggestionPayload(
    payload: Record<string, unknown>,
  ): SuggestionResponse | null {
    const suggestedPriceRaw = payload.suggestedPrice;
    const rationaleRaw = payload.rationale;
    const suggestedPrice =
      typeof suggestedPriceRaw === 'number'
        ? suggestedPriceRaw
        : Number(suggestedPriceRaw);
    if (
      Number.isFinite(suggestedPrice) &&
      suggestedPrice > 0 &&
      typeof rationaleRaw === 'string'
    ) {
      return {
        suggestedPrice,
        rationale: rationaleRaw.trim(),
      };
    }
    return null;
  }

  private async updateProductPrice(productId: string, suggestedPrice: number) {
    if (!this.productServiceUrl) {
      throw new BadRequestException(
        'PRODUCT_SERVICE_URL or CATALOG_SERVICE_URL must be configured for price updates',
      );
    }

    const base = this.productServiceUrl.replace(/\/$/, '');
    const candidates = [
      { method: 'patch' as const, url: `${base}/admin/products/${productId}` },
      { method: 'put' as const, url: `${base}/products/${productId}` },
    ];

    let lastError: string | null = null;
    for (const candidate of candidates) {
      try {
        await this.httpService.axiosRef.request({
          method: candidate.method,
          url: candidate.url,
          data: { price: suggestedPrice },
          timeout: 5000,
        });
        return;
      } catch {
        lastError = 'upstream request failed';
      }
    }

    throw new BadRequestException(
      `Unable to update product price for ${productId}: ${lastError || 'unknown error'}`,
    );
  }
}
