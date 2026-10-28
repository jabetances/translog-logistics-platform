import type { Relation } from 'typeorm';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { ShipmentStatus } from '../domain/shipment-status.js';
import { Shipment } from './shipment.entity.js';

@Entity('shipment_events')
@Index(['shipmentId', 'createdAt'])
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) shipmentId!: string;
  @ManyToOne(() => Shipment, (shipment) => shipment.events, { onDelete: 'CASCADE' }) shipment!: Relation<Shipment>;
  @Column({ type: 'enum', enum: ShipmentStatus }) status!: ShipmentStatus;
  @Column({ type: 'uuid', nullable: true }) actorId!: string | null;
  @Column({ length: 200 }) location!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
