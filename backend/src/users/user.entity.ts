import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole { OPERATOR = 'OPERATOR', SUPERVISOR = 'SUPERVISOR' }
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index({ unique: true }) @Column({ unique: true, length: 254 }) email!: string;
  @Column({ select: false }) passwordHash!: string;
  @Column({ length: 120 }) fullName!: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.OPERATOR }) role!: UserRole;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
