import { Controller, Get, Patch, Param, Post, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller(['pricing', 'admin/pricing'])
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
  async approveSuggestion(@Param('id') id: string) {
    const data = await this.pricingService.approveSuggestion(id);
    return { success: true, data };
  }

  @Patch('suggestions/:id/reject')
  async rejectSuggestion(@Param('id') id: string) {
    const data = await this.pricingService.rejectSuggestion(id);
    return { success: true, data };
  }
}
