import { describe, expect, it, vi } from 'vitest';

import type { DataSource, Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity.js';
import { ShipmentStatus } from './domain/shipment-status.js';
import {
  isPostgresUniqueViolation,
  normalizeSearchTerm,
  ShipmentsService,
  trackingDateMadrid,
} from './shipments.service.js';

describe('ShipmentsService.list', () => {
  it('combina estado, búsqueda insensible a tildes y paginación', async () => {
    const query = {
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
    };
    const createQueryBuilder = vi.fn().mockReturnValue(query);
    const service = new ShipmentsService(
      { createQueryBuilder } as unknown as Repository<Shipment>,
      {} as DataSource,
    );

    await service.list(
      2,
      10,
      ShipmentStatus.IN_TRANSIT,
      '  MÁLAGA  ',
      'trackingCode',
      'DESC',
    );

    expect(createQueryBuilder).toHaveBeenCalledWith('shipment');
    expect(query.andWhere).toHaveBeenNthCalledWith(
      1,
      'shipment.status = :status',
      {
        status: ShipmentStatus.IN_TRANSIT,
      },
    );
    const [searchSql, parameters] = query.andWhere.mock.calls[1];
    expect(searchSql).toContain(
      "translate(lower(coalesce(shipment.destinationAddress, '')), 'áéíóúüñ', 'aeiouun') LIKE :term",
    );
    expect(searchSql.match(/LIKE :term/g)).toHaveLength(5);
    expect(parameters).toEqual({ term: '%malaga%' });
    expect(normalizeSearchTerm('Málaga')).toBe('malaga');
    expect(query.orderBy).toHaveBeenCalledWith('shipment.trackingCode', 'DESC');
    expect(query.addOrderBy).toHaveBeenCalledWith('shipment.id', 'ASC');
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.take).toHaveBeenCalledWith(10);
  });

  it('rechaza campos de ordenación arbitrarios antes de consultar', async () => {
    const createQueryBuilder = vi.fn();
    const service = new ShipmentsService(
      { createQueryBuilder } as unknown as Repository<Shipment>,
      {} as DataSource,
    );

    await expect(
      service.list(1, 20, undefined, undefined, 'passwordHash', 'ASC'),
    ).rejects.toThrow('El campo de ordenación no es válido.');
    await expect(
      service.list(1, 20, undefined, undefined, 'createdAt', 'UP'),
    ).rejects.toThrow('El sentido de ordenación debe ser ASC o DESC.');
    expect(createQueryBuilder).not.toHaveBeenCalled();
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
