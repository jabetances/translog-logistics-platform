import { describe, expect, it } from 'vitest';
import { passwordPolicyError } from './password-policy.js';

describe('passwordPolicyError', () => {
  it('accepts a unique long passphrase without composition rules', () => {
    expect(passwordPolicyError('correct horse battery staple')).toBeNull();
  });

  it('rejects short and whitespace-only passwords', () => {
    expect(passwordPolicyError('short')).toMatch(/12 caracteres/);
    expect(passwordPolicyError('              ')).toMatch(/12 caracteres/);
  });

  it('rejects common words, repeated characters, and easy sequences', () => {
    expect(passwordPolicyError('Password!ReallyLong')).toMatch(
      /fácil de adivinar/,
    );
    expect(passwordPolicyError('aaaaaaaaaaaaaa')).toMatch(/fácil de adivinar/);
    expect(passwordPolicyError('uniquephrase123456')).toMatch(
      /fácil de adivinar/,
    );
  });

  it('caps UTF-8 bytes to avoid bcrypt truncating the password', () => {
    expect(passwordPolicyError('ñ'.repeat(37))).toMatch(/72 bytes UTF-8/);
  });
});
