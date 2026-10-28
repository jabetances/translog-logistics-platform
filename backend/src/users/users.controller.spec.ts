import { describe, expect, it, vi } from "vitest";
import type { Repository } from "typeorm";
import { User } from "./user.entity.js";
import { UsersController } from "./users.controller.js";

describe("UsersController", () => {
  it("devuelve solo datos de perfil y nunca selecciona el hash de contraseña", async () => {
    const repository = { find: vi.fn().mockResolvedValue([]) };
    const controller = new UsersController(repository as unknown as Repository<User>);

    await expect(controller.list()).resolves.toEqual([]);
    expect(repository.find).toHaveBeenCalledWith({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      order: { createdAt: "DESC" },
    });
  });
});
