import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { ShipmentEvent } from './shipment-event.entity.js';
import { Shipment, numericToNumberTransformer } from './shipment.entity.js';
import { User } from '../../users/user.entity.js';

describe('shipment user relations', () => {
  it('declares restrictive foreign keys for creator and event actor', () => {
    const relations = getMetadataArgsStorage().relations;
    const createdBy = relations.find(
      (relation) =>
        relation.target === Shipment && relation.propertyName === 'createdBy',
    );
    const actor = relations.find(
      (relation) =>
        relation.target === ShipmentEvent && relation.propertyName === 'actor',
    );
    const joinColumns = getMetadataArgsStorage().joinColumns;

    expect(createdBy).toMatchObject({
      relationType: 'many-to-one',
      options: { nullable: false, onDelete: 'RESTRICT' },
    });
    expect(actor).toMatchObject({
      relationType: 'many-to-one',
      options: { nullable: true, onDelete: 'RESTRICT' },
    });
    expect(joinColumns).toContainEqual(
      expect.objectContaining({
        target: Shipment,
        propertyName: 'createdBy',
        name: 'createdById',
      }),
    );
    expect(joinColumns).toContainEqual(
      expect.objectContaining({
        target: ShipmentEvent,
        propertyName: 'actor',
        name: 'actorId',
      }),
    );
    expect(
      getMetadataArgsStorage().relations.some(
        (relation) =>
          relation.target === User &&
          relation.propertyName === 'createdShipments',
      ),
    ).toBe(true);
  });

  it('returns PostgreSQL numeric values as JavaScript numbers', () => {
    expect(numericToNumberTransformer.from('67.000')).toBe(67);
    expect(numericToNumberTransformer.to(67)).toBe(67);
  });
});
