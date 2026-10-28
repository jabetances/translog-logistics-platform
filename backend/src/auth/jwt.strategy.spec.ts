import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { describe, expect, it, vi } from "vitest";
import type { Repository } from "typeorm";
import { User, UserRole } from "../users/user.entity.js";
import { JwtStrategy } from "./jwt.strategy.js";

const makeStrategy = (findOne: ReturnType<typeof vi.fn>) => new JwtStrategy(
  { getOrThrow: () => "test-secret" } as unknown as ConfigService,
  { findOne } as unknown as Repository<User>,
);

describe("JwtStrategy", () => {
  it("usa el rol y el correo actuales de la base de datos", async () => {
    const findOne = vi.fn().mockResolvedValue({ id: "user-1", email: "actual@example.com", role: UserRole.OPERATOR });
    const strategy = makeStrategy(findOne);

    await expect(strategy.validate({ sub: "user-1", email: "anterior@example.com", role: UserRole.SUPERVISOR })).resolves.toEqual({
      sub: "user-1",
      email: "actual@example.com",
      role: UserRole.OPERATOR,
    });
    expect(findOne).toHaveBeenCalledWith({ where: { id: "user-1" }, select: { id: true, email: true, role: true } });
  });

  it("rechaza tokens de cuentas eliminadas", async () => {
    const strategy = makeStrategy(vi.fn().mockResolvedValue(null));
    await expect(strategy.validate({ sub: "deleted", email: "x@example.com", role: UserRole.OPERATOR })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
