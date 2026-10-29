export const PASSWORD_MIN_CHARACTERS = 12;
export const PASSWORD_MAX_UTF8_BYTES = 72;

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

export type PasswordRule = { id: string; label: string; valid: boolean };

export function passwordRules(password: string): PasswordRule[] {
  const normalized = compact(password);
  const tooCommon =
    WEAK_FRAGMENTS.some((fragment) => normalized.includes(fragment)) ||
    SEQUENCES.some((sequence) => normalized.includes(sequence)) ||
    /^(.)\1{5,}$/.test(normalized);
  return [
    {
      id: 'length',
      label: '12 caracteres como mínimo',
      valid: Array.from(password.trim()).length >= PASSWORD_MIN_CHARACTERS,
    },
    {
      id: 'bytes',
      label: 'Máximo 72 bytes UTF-8 (límite del hash)',
      valid: new TextEncoder().encode(password).length <= PASSWORD_MAX_UTF8_BYTES,
    },
    {
      id: 'unique',
      label: 'Evita claves comunes y secuencias fáciles',
      valid: password.length === 0 || !tooCommon,
    },
  ];
}

export function passwordPolicyError(password: string): string | null {
  const failedRule = passwordRules(password).find((rule) => !rule.valid);
  if (!failedRule) return null;
  if (failedRule.id === 'length')
    return 'Usa al menos 12 caracteres; una frase larga funciona muy bien.';
  if (failedRule.id === 'bytes')
    return 'La contraseña supera el límite de 72 bytes UTF-8; prueba una frase más corta.';
  return 'Es demasiado fácil de adivinar; evita claves comunes, repeticiones y secuencias.';
}
