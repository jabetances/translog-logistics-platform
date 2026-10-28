import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShipmentEvent } from '../shipments/entities/shipment-event.entity.js';
import { Shipment } from '../shipments/entities/shipment.entity.js';

export enum UserRole {
  OPERATOR = 'OPERATOR',
  SUPERVISOR = 'SUPERVISOR',
}

@Entity('users')
export class User {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'operador@translog.es', maxLength: 254 })
  @Index({ unique: true })
  @Column({ unique: true, length: 254 })
  email!: string;

  @ApiHideProperty()
  @Column({ select: false })
  passwordHash!: string;

  @ApiProperty({ example: 'Ana Pérez', maxLength: 120 })
  @Column({ length: 120 })
  fullName!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.OPERATOR })
  role!: UserRole;
  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Shipment, (shipment) => shipment.createdBy, {
    cascade: false,
  })
  createdShipments!: Relation<Shipment[]>;

  @OneToMany(() => ShipmentEvent, (event) => event.actor, { cascade: false })
  recordedEvents!: Relation<ShipmentEvent[]>;
}
