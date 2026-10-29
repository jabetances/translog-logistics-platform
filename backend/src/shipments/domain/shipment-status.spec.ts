import { describe, expect, it } from 'vitest';
import {
  assertTransition,
  canTransition,
  ShipmentStatus as S,
} from './shipment-status.js';

describe('shipment transitions', () => {
  it('allows the normal delivery flow', () => {
    expect(canTransition(S.CREATED, S.IN_WAREHOUSE)).toBe(true);
    expect(canTransition(S.IN_WAREHOUSE, S.IN_TRANSIT)).toBe(true);
    expect(canTransition(S.IN_TRANSIT, S.OUT_FOR_DELIVERY)).toBe(true);
    expect(canTransition(S.OUT_FOR_DELIVERY, S.DELIVERED)).toBe(true);
  });
  it('only allows returns from the delivery route and cancellation before delivery', () => {
    expect(canTransition(S.CREATED, S.CANCELLED)).toBe(true);
    expect(canTransition(S.IN_WAREHOUSE, S.CANCELLED)).toBe(true);
    expect(canTransition(S.IN_TRANSIT, S.CANCELLED)).toBe(true);
    expect(canTransition(S.OUT_FOR_DELIVERY, S.CANCELLED)).toBe(true);
    expect(canTransition(S.OUT_FOR_DELIVERY, S.RETURNED)).toBe(true);
    expect(canTransition(S.RETURNED, S.CANCELLED)).toBe(true);

    expect(canTransition(S.CREATED, S.RETURNED)).toBe(false);
    expect(canTransition(S.IN_WAREHOUSE, S.RETURNED)).toBe(false);
    expect(canTransition(S.IN_TRANSIT, S.RETURNED)).toBe(false);
  });

  it('rejects skipping steps and changing delivered shipments', () => {
    expect(() => assertTransition(S.CREATED, S.DELIVERED)).toThrow(
      /No se puede cambiar el estado del envío/,
    );
    expect(canTransition(S.DELIVERED, S.CANCELLED)).toBe(false);
  });
});
