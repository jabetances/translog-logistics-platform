import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Shipment } from '../shipments/entities/shipment.entity.js';
import { ShipmentEvent } from '../shipments/entities/shipment-event.entity.js';
import { UpdateUserDto } from './update-user.dto.js';
import { User, UserRole } from './user.entity.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERVISOR)
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Shipment)
    private readonly shipments: Repository<Shipment>,
    @InjectRepository(ShipmentEvent)
    private readonly events: Repository<ShipmentEvent>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo supervisor)' })
  list() {
    return this.users.find({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar nombre, correo o rol de un usuario (solo supervisor)',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: { user: { sub: string } },
  ) {
    if (
      dto.fullName === undefined &&
      dto.email === undefined &&
      dto.role === undefined
    ) {
      throw new BadRequestException('Indica al menos un dato para actualizar');
    }
    if (dto.role !== undefined && request.user.sub === id) {
      throw new BadRequestException(
        'No puedes cambiar tu propio rol desde esta pantalla',
      );
    }

    const user = await this.users.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.email) {
      const duplicate = await this.users.findOne({
        where: { email: dto.email },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== id)
        throw new ConflictException(
          'Ese correo ya está asociado a otra cuenta',
        );
    }
    if (user.role === UserRole.SUPERVISOR && dto.role === UserRole.OPERATOR) {
      const supervisors = await this.users.count({
        where: { role: UserRole.SUPERVISOR },
      });
      if (supervisors <= 1)
        throw new ConflictException(
          'No se puede degradar al último supervisor',
        );
    }

    const changes: Partial<User> = {};
    if (dto.fullName !== undefined) changes.fullName = dto.fullName;
    if (dto.email !== undefined) changes.email = dto.email;
    if (dto.role !== undefined) changes.role = dto.role;
    const result = await this.users.update(id, changes);
    if (!result.affected) throw new NotFoundException('Usuario no encontrado');
    const updated = await this.users.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return updated;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un usuario sin actividad asociada (solo supervisor)',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user: { sub: string } },
  ) {
    if (request.user.sub === id)
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    const user = await this.users.findOne({
      where: { id },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const [createdShipments, recordedEvents] = await Promise.all([
      this.shipments.count({ where: { createdById: id } }),
      this.events.count({ where: { actorId: id } }),
    ]);
    if (createdShipments || recordedEvents) {
      throw new ConflictException(
        'No se puede eliminar: el usuario tiene envíos o eventos asociados',
      );
    }
    if (
      user.role === UserRole.SUPERVISOR &&
      (await this.users.count({ where: { role: UserRole.SUPERVISOR } })) <= 1
    ) {
      throw new ConflictException('No se puede eliminar al último supervisor');
    }

    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException('Usuario no encontrado');
    return { id, message: 'Usuario eliminado correctamente' };
  }
}
