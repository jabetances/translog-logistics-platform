import { describe, expect, it } from 'vitest';
import { assignVehiclesFFD } from './assign-vehicles.js';

const shipment = (shipmentId: string, weight: number) => ({ shipmentId, trackingCode: 'ENV-' + shipmentId, weight });

describe('assignVehiclesFFD', () => {
  it('sorts descending and assigns to the first vehicle with room', () => {
    const result = assignVehiclesFFD([shipment('a', 45), shipment('b', 32.5), shipment('c', 67), shipment('d', 55), shipment('e', 67)], 100);
    expect(result.totalVehiclesUsed).toBe(3);
    expect(result.vehicles[0].shipments.map((s) => s.weight)).toEqual([67, 32.5]);
    expect(result.vehicles[0].totalWeight).toBe(99.5);
    expect(result.totalWeight).toBe(266.5);
  });
  it('fails clearly when a package does not fit', () => {
    expect(() => assignVehiclesFFD([shipment('heavy', 101)], 100)).toThrow(/supera la capacidad del vehículo/);
  });
  it('rejects invalid capacity and duplicate IDs', () => {
    expect(() => assignVehiclesFFD([], 0)).toThrow(/número positivo/);
    expect(() => assignVehiclesFFD([shipment('x', 2), shipment('x', 3)], 10)).toThrow(/repetirse/);
  });
});
