import { registerDecorator } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

export const PASSWORD_MIN_CHARACTERS = 12;
export const PASSWORD_MAX_UTF8_BYTES = 72;
export const PASSWORD_POLICY_MESSAGE =
  'Usa una frase única de al menos 12 caracteres, no más de 72 bytes UTF-8 y evita claves habituales o secuencias sencillas.';

const WEAK_FRAGMENTS = [
  'password',
  'passw0rd',
  'admin',
  'qwerty',
  'asdf',
  'letmein',
  'welcome',
  'iloveyou',
  'monkey',
  'dragon',
  'sunshine',
  'football',
  'baseball',
  'changeme',
  'secret',
  'qazwsx',
];
const SEQUENCES = [
  '012345',
  '123456',
  '234567',
  '345678',
  '456789',
  '987654',
  '876543',
  '765432',
  '654321',
  '543210',
];

function compact(password: string): string {
  return password
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function passwordPolicyError(value: unknown): string | null {
  if (typeof value !== 'string') return 'La contraseña debe ser texto.';
  const characters = Array.from(value.trim()).length;
  if (characters < PASSWORD_MIN_CHARACTERS)
    return 'Usa al menos 12 caracteres; una frase larga funciona muy bien.';
  if (Buffer.byteLength(value, 'utf8') > PASSWORD_MAX_UTF8_BYTES)
    return 'La contraseña supera el límite de 72 bytes UTF-8; prueba una frase más corta.';

  const normalized = compact(value);
  if (
    WEAK_FRAGMENTS.some((fragment) => normalized.includes(fragment)) ||
    SEQUENCES.some((sequence) => normalized.includes(sequence)) ||
    /^(.)\1{5,}$/.test(normalized)
  ) {
    return 'Es demasiado fácil de adivinar; evita claves comunes, repeticiones y secuencias.';
  }
  return null;
}

export function IsAcceptablePassword(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'isAcceptablePassword',
      target: target.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message: validationOptions?.message ?? PASSWORD_POLICY_MESSAGE,
      },
      validator: {
        validate(value: unknown) {
          return passwordPolicyError(value) === null;
        },
      },
    });
  };
}
