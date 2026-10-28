import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service.js';
@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly service: ShipmentsService) {}
  @Get(':trackingCode')
  @ApiOperation({ summary: 'Consultar tracking público' })
  get(@Param('trackingCode') code: string) {
    return this.service.track(code);
  }
}
