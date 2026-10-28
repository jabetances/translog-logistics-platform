import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity.js';
import { ShipmentEvent } from './entities/shipment-event.entity.js';
import { ShipmentsService } from './shipments.service.js';
import { ShipmentsController } from './shipments.controller.js';
import { TrackingController } from './tracking.controller.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({
  imports: [TypeOrmModule.forFeature([Shipment, ShipmentEvent]), AuthModule],
  controllers: [ShipmentsController, TrackingController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
