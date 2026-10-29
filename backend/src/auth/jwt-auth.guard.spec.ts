import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const contextFor = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard temporary-password gate', () => {
  const guard = new JwtAuthGuard();
  const user = { sub: 'admin-id', mustChangePassword: true };

  it('blocks protected application routes until the password changes', () => {
    expect(() =>
      guard.handleRequest(
        null,
        user,
        null,
        contextFor({ method: 'GET', baseUrl: '/api/shipments' }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows only a password-only patch to the current account', () => {
    expect(
      guard.handleRequest(
        null,
        user,
        null,
        contextFor({
          method: 'PATCH',
          baseUrl: '/api/users',
          params: { id: 'admin-id' },
          body: { password: 'a-new-long-password' },
        }),
      ),
    ).toBe(user);
  });

  it('does not allow changing profile data as a way around the gate', () => {
    expect(() =>
      guard.handleRequest(
        null,
        user,
        null,
        contextFor({
          method: 'PATCH',
          baseUrl: '/api/users',
          params: { id: 'admin-id' },
          body: {
            password: 'a-new-long-password',
            email: 'other@example.test',
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
