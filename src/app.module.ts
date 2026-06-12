import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';
import { ItemsModule } from './items/items.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { PricingModule } from './pricing/pricing.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { JwtRolesGuard } from './auth/jwt-roles.guard';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db-server-postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'dbadmin',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'order_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    LoggerModule,
    HealthModule,
    OrdersModule,
    ItemsModule,
    ShipmentsModule,
    PricingModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtRolesGuard },
  ],
})
export class AppModule {}
