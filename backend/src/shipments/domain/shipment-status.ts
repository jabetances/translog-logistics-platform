export enum ShipmentStatus {
  CREATED = 'CREATED',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

const TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  [ShipmentStatus.CREATED]: [ShipmentStatus.IN_WAREHOUSE, ShipmentStatus.CANCELLED],
  [ShipmentStatus.IN_WAREHOUSE]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.DELIVERED]: [],
  [ShipmentStatus.RETURNED]: [ShipmentStatus.CANCELLED],
  [ShipmentStatus.CANCELLED]: [],
};

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: ShipmentStatus, to: ShipmentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error('Invalid shipment status transition: ' + from + ' -> ' + to);
  }
}
