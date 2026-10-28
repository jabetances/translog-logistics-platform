import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity.js';
import { ShipmentStatus } from '../domain/shipment-status.js';
import { Shipment } from './shipment.entity.js';

@Entity('shipment_events')
@Index(['shipmentId', 'createdAt'])
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) shipmentId!: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipmentId', referencedColumnName: 'id' })
  shipment!: Relation<Shipment>;

  @Column({ type: 'enum', enum: ShipmentStatus }) status!: ShipmentStatus;
  @Column({ type: 'uuid', nullable: true }) actorId!: string | null;

  @ManyToOne(() => User, (user) => user.recordedEvents, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'actorId', referencedColumnName: 'id' })
  actor!: Relation<User> | null;

  @Column({ length: 200 }) location!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
