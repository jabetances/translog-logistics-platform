import type { ShipmentStatus } from "./shipments.service";

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  CREATED: "Creado",
  IN_WAREHOUSE: "En almacén",
  IN_TRANSIT: "En tránsito",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
  CANCELLED: "Cancelado",
};

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const STATUS_BADGE_CLASSES: Record<ShipmentStatus, string> = {
  CREATED: "status-created",
  IN_WAREHOUSE: "status-in-warehouse",
  IN_TRANSIT: "status-in-transit",
  OUT_FOR_DELIVERY: "status-out-for-delivery",
  DELIVERED: "status-delivered",
  RETURNED: "status-returned",
  CANCELLED: "status-cancelled",
};

export function shipmentStatusBadgeClass(status: ShipmentStatus): string {
  return STATUS_BADGE_CLASSES[status];
}
