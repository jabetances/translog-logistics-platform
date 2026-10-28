import type { QueryRunner } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { InitialSchema1793218670099 } from './1793218670099-InitialSchema.js';

const table = (
  name: string,
  columns: string[],
  foreignKeys: object[] = [],
) => ({
  name,
  columns: columns.map((column) => ({ name: column })),
  foreignKeys,
});

const baselineTables = {
  users: table('users', [
    'id',
    'email',
    'passwordHash',
    'fullName',
    'role',
    'createdAt',
  ]),
  shipments: table(
    'shipments',
    [
      'id',
      'trackingCode',
      'originAddress',
      'destinationAddress',
      'recipientName',
      'contactPhone',
      'weightKg',
      'status',
      'deliveredAt',
      'createdById',
      'createdAt',
      'updatedAt',
    ],
    [
      {
        columnNames: ['createdById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      },
    ],
  ),
  shipment_events: table(
    'shipment_events',
    ['id', 'shipmentId', 'status', 'actorId', 'location', 'notes', 'createdAt'],
    [
      {
        columnNames: ['actorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      },
      {
        columnNames: ['shipmentId'],
        referencedTableName: 'shipments',
        referencedColumnNames: ['id'],
      },
    ],
  ),
};

const runner = (tables: Record<string, unknown>) => {
  const query = vi.fn().mockResolvedValue(undefined);
  const queryRunner = {
    connection: { options: { type: 'postgres', schema: 'probe' } },
    getTable: vi.fn(async (name: string) => tables[name]),
    query,
  } as unknown as QueryRunner;
  return { queryRunner, query };
};

describe('InitialSchema migration', () => {
  it('creates the full entity schema from an empty schema', async () => {
    const { queryRunner, query } = runner({});
    const migration = new InitialSchema1793218670099();

    await migration.up(queryRunner);

    expect(query).toHaveBeenCalledWith(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FK_96de1112a6c3b62bf5b5fc151df'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FK_60f9f125157bd4339d8b3472cb3'),
    );
  });

  it('adopts the complete synchronized schema without duplicating constraints', async () => {
    const { queryRunner, query } = runner(baselineTables);
    const migration = new InitialSchema1793218670099();

    await expect(migration.up(queryRunner)).resolves.toBeUndefined();
    expect(query).not.toHaveBeenCalled();
  });

  it('fails closed on a partial or incompatible existing schema', async () => {
    const { queryRunner, query } = runner({ users: baselineTables.users });
    const migration = new InitialSchema1793218670099();

    await expect(migration.up(queryRunner)).rejects.toThrow(
      'esquema existente',
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('refuses destructive automatic rollback of the baseline', async () => {
    const migration = new InitialSchema1793218670099();
    await expect(migration.down()).rejects.toThrow(
      'no se revierte automáticamente',
    );
  });
});
