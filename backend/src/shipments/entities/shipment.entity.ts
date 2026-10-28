import type { Relation, ValueTransformer } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity.js';
import { ShipmentStatus } from '../domain/shipment-status.js';
import { ShipmentEvent } from './shipment-event.entity.js';

export const numericToNumberTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

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
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 3,
    transformer: numericToNumberTransformer,
  })
  weightKg!: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.CREATED,
  })
  status!: ShipmentStatus;

  @Column({ type: 'timestamptz', nullable: true }) deliveredAt!: Date | null;
  @Column({ type: 'uuid' }) createdById!: string;

  @ManyToOne(() => User, (user) => user.createdShipments, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'createdById', referencedColumnName: 'id' })
  createdBy!: Relation<User>;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;

  @OneToMany(() => ShipmentEvent, (event) => event.shipment, { cascade: false })
  events!: Relation<ShipmentEvent[]>;
}
