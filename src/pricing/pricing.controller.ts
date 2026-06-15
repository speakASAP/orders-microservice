import { Controller, Get, Patch, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { PricingService } from './pricing.service';

export const PRICING_ADMIN_ROLES = ['global:superadmin', 'internal:orders-microservice:admin'] as const;

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    email?: string;
    roles?: string[];
  };
}

@Controller(['pricing', 'admin/pricing'])
@Roles(...PRICING_ADMIN_ROLES)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('suggestions')
  async listSuggestions(@Query('limit') limit = '50', @Query('status') status = 'pending') {
    const data = await this.pricingService.listSuggestions(limit, status);
    return { success: true, data };
  }

  @Post('generate')
  async generateSuggestions() {
    const data = await this.pricingService.generateSuggestions();
    return { success: true, data };
  }

  @Patch('suggestions/:id/approve')
  async approveSuggestion(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const data = await this.pricingService.approveSuggestion(id, request.user);
    return { success: true, data };
  }

  @Patch('suggestions/:id/reject')
  async rejectSuggestion(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const data = await this.pricingService.rejectSuggestion(id, request.user);
    return { success: true, data };
  }
}
