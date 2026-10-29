import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ShipmentStatus } from '../domain/shipment-status.js';
import { UpdateStatusDto } from './update-status.dto.js';

describe('UpdateStatusDto', () => {
  it('rechaza una ubicación vacía o solo con espacios y limpia notas vacías', () => {
    const dto = plainToInstance(UpdateStatusDto, {
      status: ShipmentStatus.IN_TRANSIT,
      location: '   ',
      notes: '   ',
    });
    expect(dto.location).toBe('');
    expect(dto.notes).toBeUndefined();
    expect(
      validateSync(dto).some((error) => error.property === 'location'),
    ).toBe(true);
  });

  it('recorta los campos y conserva notas con contenido', () => {
    const dto = plainToInstance(UpdateStatusDto, {
      status: ShipmentStatus.IN_TRANSIT,
      location: '  Centro logístico  ',
      notes: '  Clasificado  ',
    });
    expect(dto.location).toBe('Centro logístico');
    expect(dto.notes).toBe('Clasificado');
    expect(validateSync(dto)).toHaveLength(0);
  });
});
