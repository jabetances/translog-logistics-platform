import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UserRole } from '../../users/user.entity.js';
import { RegisterDto } from './register.dto.js';

const validRegistration = (password: string) =>
  plainToInstance(RegisterDto, {
    email: '  ADMIN@EXAMPLE.TEST ',
    password,
    fullName: '  Admin Local  ',
    role: UserRole.OPERATOR,
  });

describe('RegisterDto password policy', () => {
  it('accepts a memorable long passphrase and normalizes the email', () => {
    const dto = validRegistration('correct horse battery staple');
    expect(dto.email).toBe('admin@example.test');
    expect(dto.fullName).toBe('Admin Local');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it.each(['short-pass', 'Password!LongEnough123', 'ñ'.repeat(37)])(
    'rejects a weak, common, or over-limit password (%j)',
    (password) => {
      const errors = validateSync(validRegistration(password));
      expect(
        errors.find((error) => error.property === 'password'),
      ).toBeDefined();
    },
  );
});
