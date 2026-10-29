import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

const FIELD_LABELS: Record<string, string> = {
  email: 'El correo electrónico',
  password: 'La contraseña',
  fullName: 'El nombre completo',
  role: 'El rol',
  originAddress: 'La dirección de origen',
  destinationAddress: 'La dirección de destino',
  recipientName: 'El nombre del destinatario',
  contactPhone: 'El teléfono de contacto',
  weightKg: 'El peso del paquete',
  status: 'El estado',
  location: 'La ubicación',
  notes: 'Las notas',
  shipmentIds: 'Los envíos seleccionados',
  vehicleCapacity: 'La capacidad del vehículo',
  page: 'La página',
  limit: 'El tamaño de página',
  sortBy: 'El campo de ordenación',
  sortDirection: 'El sentido de ordenación',
  q: 'La búsqueda',
};

function fieldLabel(property: string): string {
  return FIELD_LABELS[property] ?? 'El campo «' + property + '»';
}

function bound(message: string, pattern: RegExp): string | undefined {
  return message.match(pattern)?.[1];
}

function spanishMessage(
  property: string,
  constraint: string,
  source: string,
): string {
  const field = fieldLabel(property);
  const minimum = bound(source, /longer than or equal to ([\d.]+)/i);
  const maximum = bound(source, /shorter than or equal to ([\d.]+)/i);

  switch (constraint) {
    case 'isNotEmpty':
      return field + ' es obligatorio.';
    case 'isString':
      return field + ' debe ser texto.';
    case 'isInt':
      return field + ' debe ser un número entero.';
    case 'isIn':
      return field + ' tiene un valor no permitido.';
    case 'isEmail':
      return field + ' debe tener un formato de correo válido.';
    case 'isAcceptablePassword':
      return 'La contraseña debe tener al menos 12 caracteres, no superar 72 bytes UTF-8 y evitar claves comunes o secuencias fáciles.';
    case 'isContactPhone':
      return 'El teléfono debe incluir entre 7 y 15 cifras; puedes usar +, espacios, paréntesis o guiones.';
    case 'isNumber':
      return field + ' debe ser un número válido.';
    case 'isEnum':
      return field + ' tiene un valor no permitido.';
    case 'isLength':
      if (minimum && maximum)
        return (
          field +
          ' debe tener entre ' +
          minimum +
          ' y ' +
          maximum +
          ' caracteres.'
        );
      if (minimum)
        return field + ' debe tener al menos ' + minimum + ' caracteres.';
      if (maximum)
        return field + ' no puede superar ' + maximum + ' caracteres.';
      return field + ' tiene una longitud no válida.';
    case 'minLength':
      return minimum
        ? field + ' debe tener al menos ' + minimum + ' caracteres.'
        : field + ' es demasiado corto.';
    case 'maxLength':
      return maximum
        ? field + ' no puede superar ' + maximum + ' caracteres.'
        : field + ' es demasiado largo.';
    case 'min': {
      const value = source.match(/(-?[\d.]+)/)?.[1];
      return value
        ? field + ' debe ser mayor o igual que ' + value + '.'
        : field + ' está por debajo del mínimo permitido.';
    }
    case 'max': {
      const value = source.match(/(-?[\d.]+)/)?.[1];
      return value
        ? field + ' debe ser menor o igual que ' + value + '.'
        : field + ' supera el máximo permitido.';
    }
    case 'isArray':
      return field + ' debe ser una lista.';
    case 'arrayNotEmpty':
      return property === 'shipmentIds'
        ? 'Debes seleccionar al menos un envío.'
        : field + ' no puede estar vacío.';
    case 'arrayUnique':
      return property === 'shipmentIds'
        ? 'No se pueden repetir envíos.'
        : field + ' no debe contener elementos repetidos.';
    case 'isUuid':
      return property === 'shipmentIds'
        ? 'Cada envío debe tener un identificador válido.'
        : field + ' debe tener un identificador válido.';
    case 'whitelistValidation':
      return field + ' no está permitido.';
    default:
      return field + ' tiene un valor no válido.';
  }
}

function flatten(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.entries(error.constraints ?? {}).map(([constraint, message]) =>
      spanishMessage(error.property, constraint, message),
    ),
    ...flatten(error.children ?? []),
  ]);
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const messages = flatten(errors);
  return new BadRequestException(
    messages.length ? messages.join(' ') : 'Revisa los datos introducidos.',
  );
}
