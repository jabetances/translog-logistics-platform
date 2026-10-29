import { compare, hash } from 'bcryptjs';
import { validate } from 'class-validator';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';

const demoConfig = {
  BOOTSTRAP_SUPERVISOR_EMAIL: 'admin@example.test',
  BOOTSTRAP_SUPERVISOR_PASSWORD: 'admin',
  BOOTSTRAP_SUPERVISOR_NAME: 'Admin',
};

describe('AuthService first-run supervisor', () => {
  it('accepts the documented local credentials in the login DTO', async () => {
    const dto = Object.assign(new LoginDto(), {
      email: 'admin@example.test',
      password: 'admin',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('seeds the demo admin with a hashed password and forced rotation', async () => {
    const insert = {
      into: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      orIgnore: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(undefined),
    };
    const builder = { insert: vi.fn().mockReturnValue(insert) };
    const users = {
      count: vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1),
      findOne: vi.fn().mockResolvedValue(null),
      createQueryBuilder: vi.fn().mockReturnValue(builder),
    };
    const config = {
      get: vi.fn((key: keyof typeof demoConfig) => demoConfig[key]),
    };
    const service = new AuthService(
      users as unknown as Repository<User>,
      {} as JwtService,
      config as unknown as ConfigService,
    );

    await service.onModuleInit();

    const seed = insert.values.mock.calls[0]?.[0] as User;
    expect(seed.email).toBe('admin@example.test');
    expect(seed.fullName).toBe('Admin');
    expect(seed.role).toBe(UserRole.SUPERVISOR);
    expect(seed.mustChangePassword).toBe(true);
    expect(seed.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(await compare('admin', seed.passwordHash)).toBe(true);
  });

  it('accepts the documented demo credentials at login and returns the reset flag', async () => {
    const user = {
      id: 'admin-id',
      email: 'admin@example.test',
      fullName: 'Admin',
      role: UserRole.SUPERVISOR,
      mustChangePassword: true,
      passwordHash: await hash('admin', 12),
    };
    const query = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(user),
    };
    const jwt = { signAsync: vi.fn().mockResolvedValue('token') };
    const service = new AuthService(
      {
        createQueryBuilder: vi.fn().mockReturnValue(query),
      } as unknown as Repository<User>,
      jwt as unknown as JwtService,
      {} as ConfigService,
    );

    const result = await service.login({
      email: 'admin@example.test',
      password: 'admin',
    } as LoginDto);

    expect(result.user.mustChangePassword).toBe(true);
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'admin-id',
      email: 'admin@example.test',
      role: UserRole.SUPERVISOR,
    });
  });
});
