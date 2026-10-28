import { describe, expect, it, vi } from "vitest";
import { ILike } from "typeorm";
import type { DataSource, Repository } from "typeorm";
import { Shipment } from "./entities/shipment.entity.js";
import { ShipmentStatus } from "./domain/shipment-status.js";
import { isPostgresUniqueViolation, ShipmentsService, trackingDateMadrid } from "./shipments.service.js";

describe("ShipmentsService.list", () => {
  it("combina el estado con búsqueda textual y conserva la paginación", async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const service = new ShipmentsService({ findAndCount } as unknown as Repository<Shipment>, {} as DataSource);

    await service.list(2, 10, ShipmentStatus.IN_TRANSIT, "  ENV-ana  ", "trackingCode", "DESC");

    expect(findAndCount).toHaveBeenCalledWith({
      where: [
        { status: ShipmentStatus.IN_TRANSIT, trackingCode: ILike("%ENV-ana%") },
        { status: ShipmentStatus.IN_TRANSIT, recipientName: ILike("%ENV-ana%") },
        { status: ShipmentStatus.IN_TRANSIT, originAddress: ILike("%ENV-ana%") },
        { status: ShipmentStatus.IN_TRANSIT, destinationAddress: ILike("%ENV-ana%") },
        { status: ShipmentStatus.IN_TRANSIT, contactPhone: ILike("%ENV-ana%") },
      ],
      order: { trackingCode: "DESC", id: "ASC" },
      skip: 10,
      take: 10,
    });
  });

  it("rechaza campos de ordenación arbitrarios", async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const service = new ShipmentsService({ findAndCount } as unknown as Repository<Shipment>, {} as DataSource);

    await expect(service.list(1, 20, undefined, undefined, "passwordHash", "ASC")).rejects.toThrow("El campo de ordenación no es válido.");
    await expect(service.list(1, 20, undefined, undefined, "createdAt", "UP")).rejects.toThrow("El sentido de ordenación debe ser ASC o DESC.");
    expect(findAndCount).not.toHaveBeenCalled();
  });
});

describe("tracking-code generation helpers", () => {
  it("uses the calendar day in Europe/Madrid, including around midnight", () => {
    expect(trackingDateMadrid(new Date("2026-10-27T23:30:00.000Z"))).toBe("20261028");
    expect(trackingDateMadrid(new Date("2026-07-01T22:30:00.000Z"))).toBe("20260702");
  });

  it("retries only PostgreSQL unique-constraint violations", () => {
    expect(isPostgresUniqueViolation({ driverError: { code: "23505" } })).toBe(true);
    expect(isPostgresUniqueViolation({ driverError: { code: "ECONNRESET" } })).toBe(false);
    expect(isPostgresUniqueViolation(new Error("connection failed"))).toBe(false);
  });
});
