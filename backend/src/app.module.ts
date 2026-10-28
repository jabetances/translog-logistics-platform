import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { User } from './users/user.entity.js';
import { Shipment } from './shipments/entities/shipment.entity.js';
import { ShipmentEvent } from './shipments/entities/shipment-event.entity.js';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: config.get<number>('DB_PORT') ?? 5432,
        username: config.get<string>('DB_USER') ?? 'translog',
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME') ?? 'translog',
        entities: [User, Shipment, ShipmentEvent],
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: false,
      }),
    }),
    AuthModule,
    ShipmentsModule,
  ],
})
export class AppModule {}
