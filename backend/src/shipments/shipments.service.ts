import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, ILike } from 'typeorm';
import { randomInt } from 'node:crypto';
import { Shipment } from './entities/shipment.entity.js';
import { ShipmentEvent } from './entities/shipment-event.entity.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { assignVehiclesFFD } from './domain/assign-vehicles.js';
import { assertTransition, ShipmentStatus, SHIPMENT_STATUS_LABELS } from './domain/shipment-status.js';

@Injectable()
export class ShipmentsService {
  constructor(@InjectRepository(Shipment) private readonly shipments: Repository<Shipment>, private readonly dataSource: DataSource) {}

  async create(dto: CreateShipmentDto, actorId: string) {
    const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = randomInt(36 ** 4).toString(36).padStart(4, '0').toUpperCase();
      const trackingCode = 'ENV-' + day + '-' + suffix;
      try {
        return await this.dataSource.transaction(async (manager) => {
          const repo = manager.getRepository(Shipment);
          const shipment = await repo.save(repo.create({ originAddress: dto.originAddress, destinationAddress: dto.destinationAddress, recipientName: dto.recipientName, contactPhone: dto.contactPhone ?? null, weightKg: String(dto.weightKg), status: ShipmentStatus.CREATED, trackingCode, createdById: actorId }));
          await manager.getRepository(ShipmentEvent).save({ shipmentId: shipment.id, status: shipment.status, actorId, location: dto.originAddress, notes: 'Envío creado' });
          return repo.findOne({ where: { id: shipment.id }, relations: { events: true } });
        });
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
    throw new ConflictException('No se pudo generar un código de seguimiento único');
  }

  async list(page = 1, limit = 20, status?: ShipmentStatus, search?: string) {
    const safePage = Math.max(1, page); const safeLimit = Math.min(100, Math.max(1, limit));
    const term = search?.trim();
    const statusFilter = status ? { status } : {};
    const where = term ? [
      { ...statusFilter, trackingCode: ILike('%' + term + '%') },
      { ...statusFilter, recipientName: ILike('%' + term + '%') },
      { ...statusFilter, originAddress: ILike('%' + term + '%') },
      { ...statusFilter, destinationAddress: ILike('%' + term + '%') },
      { ...statusFilter, contactPhone: ILike('%' + term + '%') },
    ] : statusFilter;
    const [data, total] = await this.shipments.findAndCount({ where, order: { createdAt: 'DESC' }, skip: (safePage - 1) * safeLimit, take: safeLimit });
    return { data, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }

  async findOne(id: string) {
    const shipment = await this.shipments.findOne({ where: { id }, relations: { events: true } });
    if (!shipment) throw new NotFoundException('Envío no encontrado');
    shipment.events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return shipment;
  }

  async track(code: string) {
    const shipment = await this.shipments.findOne({ where: { trackingCode: code }, relations: { events: true } });
    if (!shipment) throw new NotFoundException('Código de seguimiento no encontrado');
    shipment.events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { trackingCode: shipment.trackingCode, status: shipment.status, createdAt: shipment.createdAt, deliveredAt: shipment.deliveredAt, events: shipment.events.map(({ id, status, location, notes, createdAt }) => ({ id, status, location, notes, createdAt })) };
  }

  async updateStatus(id: string, dto: UpdateStatusDto, actorId: string) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Shipment);
      const shipment = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!shipment) throw new NotFoundException('Envío no encontrado');
      try { assertTransition(shipment.status, dto.status); } catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Transición no válida'); }
      shipment.status = dto.status;
      if (dto.status === ShipmentStatus.DELIVERED) shipment.deliveredAt = new Date();
      await repo.save(shipment);
      await manager.getRepository(ShipmentEvent).save({ shipmentId: id, status: dto.status, actorId, location: dto.location, notes: dto.notes ?? null });
      const updated = await manager.getRepository(Shipment).findOne({ where: { id }, relations: { events: true } });
      if (updated?.events) updated.events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      return updated;
    });
  }

  async cancel(id: string, actorId: string) {
    return this.updateStatus(id, { status: ShipmentStatus.CANCELLED, location: 'Sistema', notes: 'Cancelado por operador' }, actorId);
  }

  async assign(ids: string[], capacity: number) {
    const rows = await this.shipments.findBy({ id: In(ids) });
    if (rows.length !== new Set(ids).size) throw new NotFoundException('Uno o más envíos no existen');
    const invalid = rows.filter((row) => row.status !== ShipmentStatus.IN_WAREHOUSE);
    if (invalid.length) throw new BadRequestException('Todos los envíos deben estar en estado «' + SHIPMENT_STATUS_LABELS[ShipmentStatus.IN_WAREHOUSE] + '»: ' + invalid.map((x) => x.trackingCode).join(', '));
    try { return assignVehiclesFFD(rows.map((row) => ({ shipmentId: row.id, trackingCode: row.trackingCode, weight: Number(row.weightKg) })), capacity); }
    catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'No se pudo asignar la carga'); }
  }
}
