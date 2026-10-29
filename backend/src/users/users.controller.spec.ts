import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { Shipment } from '../shipments/entities/shipment.entity.js';
import { ShipmentEvent } from '../shipments/entities/shipment-event.entity.js';
import { User, UserRole } from './user.entity.js';
import { UsersController } from './users.controller.js';

const makeController = () => {
  const users = {
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
  const shipments = { count: vi.fn().mockResolvedValue(0) };
  const events = { count: vi.fn().mockResolvedValue(0) };
  const controller = new UsersController(
    users as unknown as Repository<User>,
    shipments as unknown as Repository<Shipment>,
    events as unknown as Repository<ShipmentEvent>,
  );
  return { controller, users, shipments, events };
};

describe('UsersController', () => {
  it('devuelve solo datos de perfil y nunca selecciona el hash de contraseña', async () => {
    const { controller, users } = makeController();
    await expect(controller.list()).resolves.toEqual([]);
    expect(users.find).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  });

  it('actualiza nombre, correo y rol, y devuelve el perfil público', async () => {
    const { controller, users } = makeController();
    const current = {
      id: 'user-2',
      email: 'ana.old@example.com',
      fullName: 'Ana',
      role: UserRole.OPERATOR,
      createdAt: new Date(),
    };
    const profile = {
      ...current,
      email: 'ana@example.com',
      fullName: 'Ana Pérez',
      role: UserRole.SUPERVISOR,
    };
    users.findOne
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(profile);
    users.update.mockResolvedValue({ affected: 1 });

    await expect(
      controller.update(
        'user-2',
        {
          fullName: 'Ana Pérez',
          email: 'ana@example.com',
          role: UserRole.SUPERVISOR,
        },
        { user: { sub: 'user-1' } },
      ),
    ).resolves.toEqual(profile);
    expect(users.update).toHaveBeenCalledWith('user-2', {
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      role: UserRole.SUPERVISOR,
    });
  });

  it('hashea password con costo 12 y no expone passwordHash', async () => {
    const { controller, users } = makeController();
    const profile = {
      id: 'user-2',
      email: 'a@example.com',
      fullName: 'Ana',
      role: UserRole.OPERATOR,
      createdAt: new Date(),
      mustChangePassword: true,
    };
    users.findOne
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce({ ...profile, mustChangePassword: false });
    users.update.mockResolvedValue({ affected: 1 });
    const result = await controller.update(
      'user-2',
      { password: 'correct-horse-12' },
      { user: { sub: 'user-1' } },
    );
    const changes = users.update.mock.calls[0]?.[1] as Partial<User>;
    expect(changes.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(changes.mustChangePassword).toBe(false);
    expect(result.mustChangePassword).toBe(false);
    expect(result).not.toHaveProperty('passwordHash');
    expect(users.findOne.mock.calls[0]?.[0]).not.toHaveProperty(
      'select.passwordHash',
    );
    expect(users.update).toHaveBeenCalledTimes(1);
  });

  it('rechaza una actualización vacía con password null', async () => {
    const { controller, users } = makeController();
    await expect(
      controller.update(
        'user-2',
        { password: null as unknown as string },
        { user: { sub: 'user-1' } },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('impide cambiar a un correo duplicado o el propio rol', async () => {
    const duplicateEmail = makeController();
    duplicateEmail.users.findOne
      .mockResolvedValueOnce({
        id: 'user-2',
        email: 'old@example.com',
        fullName: 'Ana',
        role: UserRole.OPERATOR,
      })
      .mockResolvedValueOnce({ id: 'user-3' });
    await expect(
      duplicateEmail.controller.update(
        'user-2',
        { email: 'taken@example.com' },
        { user: { sub: 'user-1' } },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(duplicateEmail.users.update).not.toHaveBeenCalled();

    const ownRole = makeController();
    await expect(
      ownRole.controller.update(
        'user-1',
        { role: UserRole.OPERATOR },
        { user: { sub: 'user-1' } },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ownRole.users.findOne).not.toHaveBeenCalled();
  });

  it('impide degradar al último supervisor', async () => {
    const { controller, users } = makeController();
    users.findOne.mockResolvedValue({
      id: 'user-2',
      email: 'admin@example.com',
      fullName: 'Admin',
      role: UserRole.SUPERVISOR,
    });
    users.count.mockResolvedValue(1);
    await expect(
      controller.update(
        'user-2',
        { role: UserRole.OPERATOR },
        { user: { sub: 'user-1' } },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('impide eliminar la cuenta que inició sesión', async () => {
    const { controller, users } = makeController();
    await expect(
      controller.remove('user-1', { user: { sub: 'user-1' } }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.delete).not.toHaveBeenCalled();
  });

  it('preserva usuarios con actividad y al último supervisor', async () => {
    const withHistory = makeController();
    withHistory.users.findOne.mockResolvedValue({
      id: 'user-2',
      role: UserRole.OPERATOR,
    });
    withHistory.shipments.count.mockResolvedValue(1);
    await expect(
      withHistory.controller.remove('user-2', { user: { sub: 'user-1' } }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(withHistory.users.delete).not.toHaveBeenCalled();

    const lastSupervisor = makeController();
    lastSupervisor.users.findOne.mockResolvedValue({
      id: 'user-3',
      role: UserRole.SUPERVISOR,
    });
    lastSupervisor.users.count.mockResolvedValue(1);
    await expect(
      lastSupervisor.controller.remove('user-3', { user: { sub: 'user-1' } }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(lastSupervisor.users.delete).not.toHaveBeenCalled();
  });

  it('elimina un usuario sin actividad asociada', async () => {
    const { controller, users } = makeController();
    users.findOne.mockResolvedValue({ id: 'user-2', role: UserRole.OPERATOR });
    users.delete.mockResolvedValue({ affected: 1 });

    await expect(
      controller.remove('user-2', { user: { sub: 'user-1' } }),
    ).resolves.toEqual({
      id: 'user-2',
      message: 'Usuario eliminado correctamente',
    });
  });
});
