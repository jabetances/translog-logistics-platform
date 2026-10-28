import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ShipmentStatus } from '../domain/shipment-status.js';
export class UpdateStatusDto {
  @IsEnum(ShipmentStatus) status!: ShipmentStatus;
  @IsString() @Length(2, 200) location!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
