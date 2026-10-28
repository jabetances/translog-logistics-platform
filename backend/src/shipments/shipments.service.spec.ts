import { describe, expect, it, vi } from 'vitest';
import { ILike } from 'typeorm';
import type { DataSource, Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity.js';
import { ShipmentStatus } from './domain/shipment-status.js';
import {
  isPostgresUniqueViolation,
  ShipmentsService,
  trackingDateMadrid,
} from './shipments.service.js';

describe('ShipmentsService.list', () => {
  it('combina el estado con búsqueda textual y conserva la paginación', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const service = new ShipmentsService(
      { findAndCount } as unknown as Repository<Shipment>,
      {} as DataSource,
    );

    await service.list(
      2,
      10,
      ShipmentStatus.IN_TRANSIT,
      '  ENV-ana  ',
      'trackingCode',
      'DESC',
    );

    expect(findAndCount).toHaveBeenCalledWith({
      where: [
        { status: ShipmentStatus.IN_TRANSIT, trackingCode: ILike('%ENV-ana%') },
        {
          status: ShipmentStatus.IN_TRANSIT,
          recipientName: ILike('%ENV-ana%'),
        },
        {
          status: ShipmentStatus.IN_TRANSIT,
          originAddress: ILike('%ENV-ana%'),
        },
        {
          status: ShipmentStatus.IN_TRANSIT,
          destinationAddress: ILike('%ENV-ana%'),
        },
        { status: ShipmentStatus.IN_TRANSIT, contactPhone: ILike('%ENV-ana%') },
      ],
      order: { trackingCode: 'DESC', id: 'ASC' },
      skip: 10,
      take: 10,
    });
  });

  it('rechaza campos de ordenación arbitrarios', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const service = new ShipmentsService(
      { findAndCount } as unknown as Repository<Shipment>,
      {} as DataSource,
    );

    await expect(
      service.list(1, 20, undefined, undefined, 'passwordHash', 'ASC'),
    ).rejects.toThrow('El campo de ordenación no es válido.');
    await expect(
      service.list(1, 20, undefined, undefined, 'createdAt', 'UP'),
    ).rejects.toThrow('El sentido de ordenación debe ser ASC o DESC.');
    expect(findAndCount).not.toHaveBeenCalled();
  });
});

describe('tracking-code generation helpers', () => {
  it('uses the calendar day in Europe/Madrid, including around midnight', () => {
    expect(trackingDateMadrid(new Date('2026-10-27T23:30:00.000Z'))).toBe(
      '20261028',
    );
    expect(trackingDateMadrid(new Date('2026-07-01T22:30:00.000Z'))).toBe(
      '20260702',
    );
  });

  it('retries only PostgreSQL unique-constraint violations', () => {
    expect(isPostgresUniqueViolation({ driverError: { code: '23505' } })).toBe(
      true,
    );
    expect(
      isPostgresUniqueViolation({ driverError: { code: 'ECONNRESET' } }),
    ).toBe(false);
    expect(isPostgresUniqueViolation(new Error('connection failed'))).toBe(
      false,
    );
  });
});

describe('ShipmentsService.track', () => {
  it('normaliza el código y no expone al actor en el seguimiento público', async () => {
    const findOne = vi.fn().mockResolvedValue({
      trackingCode: 'ENV-20261028-AB12',
      status: ShipmentStatus.IN_TRANSIT,
      createdAt: new Date('2026-10-28T12:00:00.000Z'),
      deliveredAt: null,
      events: [
        {
          id: 'event-1',
          actorId: 'private-user-id',
          actor: { fullName: 'Operador Interno' },
          status: ShipmentStatus.IN_TRANSIT,
          location: 'Centro logístico',
          notes: null,
          createdAt: new Date('2026-10-28T12:00:00.000Z'),
        },
      ],
    });
    const service = new ShipmentsService(
      { findOne } as unknown as Repository<Shipment>,
      {} as DataSource,
    );

    const result = await service.track(' env-20261028-ab12 ');

    expect(findOne).toHaveBeenCalledWith({
      where: { trackingCode: 'ENV-20261028-AB12' },
      relations: { events: true },
    });
    expect(result.events[0]).not.toHaveProperty('actorId');
    expect(result.events[0]).not.toHaveProperty('actorName');
    expect(JSON.stringify(result)).not.toContain('Operador Interno');
  });
});

describe('ShipmentsService.findOne', () => {
  it('incluye responsables y transiciones sin devolver sus UUIDs', async () => {
    const findOne = vi.fn().mockResolvedValue({
      id: 'shipment-1',
      trackingCode: 'ENV-20261028-AB12',
      originAddress: 'Origen',
      destinationAddress: 'Destino',
      recipientName: 'Ana',
      contactPhone: null,
      weightKg: 67,
      status: ShipmentStatus.IN_TRANSIT,
      deliveredAt: null,
      createdAt: new Date('2026-10-28T09:00:00.000Z'),
      updatedAt: new Date('2026-10-28T10:00:00.000Z'),
      createdById: 'creator-private-id',
      createdBy: { fullName: 'Supervisora' },
      events: [
        {
          id: 'event-1',
          actorId: 'operator-private-id',
          actor: { fullName: 'Operador A' },
          status: ShipmentStatus.IN_TRANSIT,
          location: 'Centro logístico',
          notes: null,
          createdAt: new Date('2026-10-28T10:00:00.000Z'),
        },
      ],
    });
    const service = new ShipmentsService(
      { findOne } as unknown as Repository<Shipment>,
      {} as DataSource,
    );

    const detail = await service.findOne('shipment-1');

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'shipment-1' },
      relations: { createdBy: true, events: { actor: true } },
    });
    expect(detail.createdByName).toBe('Supervisora');
    expect(detail.allowedTransitions).toEqual([
      'OUT_FOR_DELIVERY',
      'RETURNED',
      'CANCELLED',
    ]);
    expect(detail.events[0].actorName).toBe('Operador A');
    expect(detail).not.toHaveProperty('createdById');
    expect(detail.events[0]).not.toHaveProperty('actorId');
  });
});
