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
