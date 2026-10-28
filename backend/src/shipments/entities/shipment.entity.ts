import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShipmentStatus } from '../domain/shipment-status.js';
import { ShipmentEvent } from './shipment-event.entity.js';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index({ unique: true })
  @Column({ unique: true, length: 24 })
  trackingCode!: string;
  @Column({ length: 240 }) originAddress!: string;
  @Column({ length: 240 }) destinationAddress!: string;
  @Column({ length: 160 }) recipientName!: string;
  @Column({ type: 'varchar', nullable: true, length: 40 }) contactPhone!:
    string | null;
  @Column({ type: 'numeric', precision: 10, scale: 3 }) weightKg!: string;
  @Index()
  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.CREATED,
  })
  status!: ShipmentStatus;
  @Column({ type: 'timestamptz', nullable: true }) deliveredAt!: Date | null;
  @Column({ type: 'uuid' }) createdById!: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
  @OneToMany(() => ShipmentEvent, (event) => event.shipment, { cascade: false })
  events!: Relation<ShipmentEvent[]>;
}
