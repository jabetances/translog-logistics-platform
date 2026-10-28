import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { AssignVehiclesDto } from './dto/assign-vehicles.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';
import { ShipmentStatus } from './domain/shipment-status.js';
import {
  ListShipmentsQueryDto,
  SHIPMENT_SORT_FIELDS,
} from './dto/list-shipments-query.dto.js';

@ApiTags('shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly service: ShipmentsService) {}
  @Post()
  @ApiOperation({ summary: 'Crear un envío' })
  create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.sub);
  }
  @Get()
  @ApiOperation({ summary: 'Listar envíos con filtros y ordenación' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @ApiQuery({ name: 'status', required: false, enum: ShipmentStatus })
  @ApiQuery({ name: 'q', required: false, type: String, maxLength: 100 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: SHIPMENT_SORT_FIELDS,
    default: 'createdAt',
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  list(@Query() query: ListShipmentsQueryDto) {
    return this.service.list(
      query.page,
      query.limit,
      query.status,
      query.q,
      query.sortBy,
      query.sortDirection,
    );
  }
  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de un envío y su historial' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar el estado y añadir un evento al historial',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateStatus(id, dto, user.sub);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar un envío conservando su historial' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.cancel(id, user.sub);
  }
  @Post('assign-vehicles')
  @ApiOperation({
    summary: 'Distribuir envíos por vehículos con First Fit Decreasing',
  })
  assign(@Body() dto: AssignVehiclesDto) {
    return this.service.assign(dto.shipmentIds, dto.vehicleCapacity);
  }
}
