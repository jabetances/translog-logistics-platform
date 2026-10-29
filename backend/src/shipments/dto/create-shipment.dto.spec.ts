import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateShipmentDto } from './create-shipment.dto.js';
import { validationExceptionFactory } from '../../common/validation-messages.js';

const validShipment = (contactPhone: string) =>
  plainToInstance(CreateShipmentDto, {
    originAddress: 'Calle Mayor',
    destinationAddress: 'Avenida Sol',
    recipientName: 'Ana Pérez',
    contactPhone,
    weightKg: 1.25,
  });

describe('CreateShipmentDto', () => {
  it('rechaza direcciones que solo contienen espacios', () => {
    const dto = plainToInstance(CreateShipmentDto, {
      originAddress: '   ',
      destinationAddress: 'Avenida Sol',
      recipientName: 'Ana Pérez',
      weightKg: 1.25,
    });
    expect(dto.originAddress).toBe('');
    expect(
      validateSync(dto).some((error) => error.property === 'originAddress'),
    ).toBe(true);
  });
  it.each(['', '   '])(
    'acepta el teléfono opcional vacío (%j)',
    (contactPhone) => {
      const dto = validShipment(contactPhone);
      expect(dto.contactPhone).toBeUndefined();
      expect(validateSync(dto)).toHaveLength(0);
    },
  );

  it('acepta teléfonos formateados con un número razonable de cifras', () => {
    const dto = validShipment(' +34 (600) 123-456 ');
    expect(dto.contactPhone).toBe('+34 (600) 123-456');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it.each(['1234', 'abcdefgh', '+34 600 ABC 123', '1234567890123456'])(
    'rechaza teléfonos que no parecen utilizables (%j)',
    (contactPhone) => {
      const errors = validateSync(validShipment(contactPhone));
      expect(errors.some((error) => error.property === 'contactPhone')).toBe(
        true,
      );
      const response = validationExceptionFactory(errors).getResponse();
      expect(JSON.stringify(response)).toContain(
        'El teléfono debe incluir entre 7 y 15 cifras',
      );
    },
  );
});
