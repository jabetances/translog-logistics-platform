import { describe, expect, it } from 'vitest';
import type { ValidationError } from 'class-validator';
import { validationExceptionFactory } from './validation-messages.js';

describe('validationExceptionFactory', () => {
  it('muestra en español el error de longitud del teléfono', () => {
    const errors: ValidationError[] = [
      {
        property: 'contactPhone',
        constraints: {
          isLength:
            'contactPhone must be longer than or equal to 5 and shorter than or equal to 40 characters',
        },
        children: [],
      },
    ];

    const response = validationExceptionFactory(errors).getResponse();
    expect(JSON.stringify(response)).toContain(
      'El teléfono de contacto debe tener entre 5 y 40 caracteres.',
    );
    expect(JSON.stringify(response)).not.toContain('contactPhone');
  });
});
