import type { QueryRunner } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { RequirePasswordChange1793262152679 } from './1793262152679-RequirePasswordChange.js';

const makeRunner = (alreadyExists = false) => {
  const addColumn = vi.fn().mockResolvedValue(undefined);
  const runner = {
    hasColumn: vi.fn().mockResolvedValue(alreadyExists),
    addColumn,
  } as unknown as QueryRunner;
  return { runner, addColumn };
};

describe('RequirePasswordChange migration', () => {
  it('adds a false-by-default flag to existing users', async () => {
    const { runner, addColumn } = makeRunner();
    await new RequirePasswordChange1793262152679().up(runner);
    expect(addColumn).toHaveBeenCalledWith(
      'users',
      expect.objectContaining({
        name: 'mustChangePassword',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );
  });

  it('does not duplicate the flag after synchronize', async () => {
    const { runner, addColumn } = makeRunner(true);
    await expect(
      new RequirePasswordChange1793262152679().up(runner),
    ).resolves.toBeUndefined();
    expect(addColumn).not.toHaveBeenCalled();
  });

  it('refuses a rollback that could bypass the reset requirement', async () => {
    await expect(
      new RequirePasswordChange1793262152679().down(),
    ).rejects.toThrow('No se revierte automáticamente');
  });
});
