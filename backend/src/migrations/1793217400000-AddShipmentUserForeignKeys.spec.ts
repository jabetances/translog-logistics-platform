import type { QueryRunner } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { AddShipmentUserForeignKeys1793217400000 } from './1793217400000-AddShipmentUserForeignKeys.js';

describe('AddShipmentUserForeignKeys migration', () => {
  it('checks for orphan references before adding restrictive constraints', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const migration = new AddShipmentUserForeignKeys1793217400000();

    await migration.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0][0]).toContain('createdById');
    expect(query.mock.calls[0][0]).toContain('actorId');
    expect(query.mock.calls[1][0]).toContain('ON DELETE RESTRICT');
    expect(query.mock.calls[2][0]).toContain('ON DELETE RESTRICT');
  });

  it('reverts both constraints', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const migration = new AddShipmentUserForeignKeys1793217400000();

    await migration.down({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toContain('FK_shipment_events_actor_user');
    expect(query.mock.calls[1][0]).toContain('FK_shipments_created_by_user');
  });
});
