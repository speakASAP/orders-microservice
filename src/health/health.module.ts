import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { HealthController } from './health.controller';
import { CredentialSelfReporter } from './credential-self-reporter';

@Module({
  imports: [OrdersModule],
  controllers: [HealthController],
  providers: [CredentialSelfReporter],
})
export class HealthModule {}
