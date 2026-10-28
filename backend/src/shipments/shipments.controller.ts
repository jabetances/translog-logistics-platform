import { BadRequestException, Body, Controller, Delete, Get, Param, ParseEnumPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AssignVehiclesDto } from './dto/assign-vehicles.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ShipmentStatus } from './domain/shipment-status.js';

@ApiTags('shipments') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('shipments')
export class ShipmentsController {
  constructor(private readonly service: ShipmentsService) {}
  @Post() @ApiOperation({ summary: 'Crear un envío' }) create(@Body() dto: CreateShipmentDto, @Req() req: any) { return this.service.create(dto, req.user.sub); }
  @Get() list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status', new ParseEnumPipe(ShipmentStatus, { optional: true, exceptionFactory: () => new BadRequestException('El filtro de estado no es válido.') })) status?: ShipmentStatus, @Query('q') search?: string) { return this.service.list(Number(page) || 1, Number(limit) || 20, status, search); }
  @Get(':id') detail(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id/status') update(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Req() req: any) { return this.service.updateStatus(id, dto, req.user.sub); }
  @Delete(':id') cancel(@Param('id') id: string, @Req() req: any) { return this.service.cancel(id, req.user.sub); }
  @Post('assign-vehicles') assign(@Body() dto: AssignVehiclesDto) { return this.service.assign(dto.shipmentIds, dto.vehicleCapacity); }
}
