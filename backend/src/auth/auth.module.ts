import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { Shipment } from '../shipments/entities/shipment.entity.js';
import { ShipmentEvent } from '../shipments/entities/shipment-event.entity.js';
import { AuthController } from './auth.controller.js';
import { UsersController } from '../users/users.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './roles.guard.js';
@Module({ imports: [TypeOrmModule.forFeature([User, Shipment, ShipmentEvent]), PassportModule, ConfigModule, JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET'), signOptions: { expiresIn: '8h' } }) })], controllers: [AuthController, UsersController], providers: [AuthService, JwtStrategy, RolesGuard], exports: [JwtModule, PassportModule, JwtStrategy] })
export class AuthModule {}
