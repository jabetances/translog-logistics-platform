import { describe, expect, it } from 'vitest';
import { passwordPolicyError, passwordRules } from './password-policy';

describe('password policy', () => {
  it('accepts a memorable unique passphrase without forced symbol rules', () => {
    expect(passwordPolicyError('correct horse battery staple')).toBeNull();
  });

  it('requires 12 non-blank characters', () => {
    expect(passwordPolicyError('short')).toMatch(/12 caracteres/);
    expect(passwordPolicyError('              ')).toMatch(/12 caracteres/);
  });

  it('rejects common words and easy sequences', () => {
    expect(passwordPolicyError('Password!ReallyLong')).toMatch(/fácil de adivinar/);
    expect(passwordRules('UniquePhrase123456').find((rule) => rule.id === 'unique')?.valid).toBe(
      false,
    );
  });

  it('enforces bcrypt UTF-8 byte limit, not just character count', () => {
    expect(passwordPolicyError('ñ'.repeat(37))).toMatch(/72 bytes UTF-8/);
  });
});
