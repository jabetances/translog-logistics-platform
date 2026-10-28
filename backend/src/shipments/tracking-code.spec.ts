import { describe, expect, it, vi } from 'vitest';
import type { DataSource, Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity.js';
import { ShipmentStatus } from './domain/shipment-status.js';
import type { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShipmentsService } from './shipments.service.js';

function makeService() {
  const shipmentRepo = {
    create: vi.fn((values: unknown) => values),
    save: vi.fn(),
    findOne: vi.fn().mockResolvedValue({
      id: 'shipment-1',
      trackingCode: 'ENV-20261028-ABCD',
    }),
  };
  const eventRepo = { save: vi.fn().mockResolvedValue({}) };
  const manager = {
    getRepository: vi.fn((entity: unknown) =>
      entity === Shipment ? shipmentRepo : eventRepo,
    ),
  };
  const transaction = vi.fn(
    (work: (manager: typeof manager) => Promise<unknown>) => work(manager),
  );
  const service = new ShipmentsService(
    {} as Repository<Shipment>,
    { transaction } as unknown as DataSource,
  );
  const dto = {
    originAddress: 'Origen 1',
    destinationAddress: 'Destino 1',
    recipientName: 'Ana',
    weightKg: 12.5,
  } as CreateShipmentDto;
  return { service, shipmentRepo, eventRepo, transaction, dto };
}

describe('ShipmentsService.create retries', () => {
  it('propaga los errores de infraestructura sin repetir la transacción', async () => {
    const { service, shipmentRepo, transaction, dto } = makeService();
    const failure = new Error('database unavailable');
    shipmentRepo.save.mockRejectedValueOnce(failure);

    await expect(service.create(dto, 'operator-1')).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('reintenta una colisión única y después crea el envío', async () => {
    const { service, shipmentRepo, eventRepo, transaction, dto } =
      makeService();
    shipmentRepo.save
      .mockRejectedValueOnce({ driverError: { code: '23505' } })
      .mockResolvedValueOnce({
        id: 'shipment-1',
        status: ShipmentStatus.CREATED,
      });

    await expect(service.create(dto, 'operator-1')).resolves.toEqual({
      id: 'shipment-1',
      trackingCode: 'ENV-20261028-ABCD',
    });
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(eventRepo.save).toHaveBeenCalledTimes(1);
  });
});
