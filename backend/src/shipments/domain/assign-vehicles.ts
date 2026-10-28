export interface WeightedShipment {
  shipmentId: string;
  trackingCode: string;
  weight: number;
}

export interface AssignedVehicle {
  vehicleNumber: number;
  shipments: WeightedShipment[];
  totalWeight: number;
  remainingCapacity: number;
}

export function assignVehiclesFFD(shipments: readonly WeightedShipment[], capacity: number): {
  vehicles: AssignedVehicle[];
  totalVehiclesUsed: number;
  totalWeight: number;
} {
  if (!Number.isFinite(capacity) || capacity <= 0) throw new Error('vehicleCapacity must be a positive number');
  const ids = new Set<string>();
  for (const shipment of shipments) {
    if (!shipment.shipmentId || ids.has(shipment.shipmentId)) throw new Error('shipmentIds must be non-empty and unique');
    ids.add(shipment.shipmentId);
    if (!Number.isFinite(shipment.weight) || shipment.weight <= 0) throw new Error('Shipment weights must be positive finite numbers');
    if (shipment.weight > capacity) throw new Error('Shipment ' + shipment.shipmentId + ' exceeds vehicle capacity (' + shipment.weight + ' kg > ' + capacity + ' kg)');
  }
  const sorted = [...shipments].sort((a, b) => b.weight - a.weight || a.shipmentId.localeCompare(b.shipmentId));
  const vehicles: AssignedVehicle[] = [];
  for (const shipment of sorted) {
    let vehicle = vehicles.find((item) => item.remainingCapacity + Number.EPSILON >= shipment.weight);
    if (!vehicle) {
      vehicle = { vehicleNumber: vehicles.length + 1, shipments: [], totalWeight: 0, remainingCapacity: capacity };
      vehicles.push(vehicle);
    }
    vehicle.shipments.push(shipment);
    vehicle.totalWeight = Number((vehicle.totalWeight + shipment.weight).toFixed(6));
    vehicle.remainingCapacity = Number((capacity - vehicle.totalWeight).toFixed(6));
  }
  return { vehicles, totalVehiclesUsed: vehicles.length, totalWeight: Number(shipments.reduce((sum, item) => sum + item.weight, 0).toFixed(6)) };
}
