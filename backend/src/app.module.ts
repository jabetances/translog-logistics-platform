import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { User } from './users/user.entity.js';
import { Shipment } from './shipments/entities/shipment.entity.js';
import { ShipmentEvent } from './shipments/entities/shipment-event.entity.js';
import { AddShipmentUserForeignKeys1793217400000 } from './migrations/1793217400000-AddShipmentUserForeignKeys.js';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const synchronize = config.get<string>('DB_SYNCHRONIZE') === 'true';
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: config.get<number>('DB_PORT') ?? 5432,
          username: config.get<string>('DB_USER') ?? 'translog',
          password: config.getOrThrow<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME') ?? 'translog',
          entities: [User, Shipment, ShipmentEvent],
          migrations: [AddShipmentUserForeignKeys1793217400000],
          synchronize,
          migrationsRun:
            !synchronize && config.get<string>('DB_MIGRATIONS_RUN') === 'true',
          logging: false,
        };
      },
    }),
    AuthModule,
    ShipmentsModule,
  ],
})
export class AppModule {}
