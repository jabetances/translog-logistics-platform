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
  it.each(['', '   '])(
    'acepta el teléfono opcional vacío (%j)',
    (contactPhone) => {
      const dto = validShipment(contactPhone);
      expect(dto.contactPhone).toBeUndefined();
      expect(validateSync(dto)).toHaveLength(0);
    },
  );

  it('sigue rechazando un teléfono no vacío demasiado corto', () => {
    const errors = validateSync(validShipment('1234'));
    expect(errors.some((error) => error.property === 'contactPhone')).toBe(
      true,
    );
    const response = validationExceptionFactory(errors).getResponse();
    expect(JSON.stringify(response)).toContain(
      'El teléfono de contacto debe tener al menos 5 caracteres.',
    );
  });
});
