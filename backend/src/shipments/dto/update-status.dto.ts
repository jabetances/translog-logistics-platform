import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ShipmentStatus } from '../domain/shipment-status.js';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ShipmentStatus,
    enumName: 'ShipmentStatus',
    example: ShipmentStatus.IN_TRANSIT,
  })
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @ApiProperty({
    example: 'Centro logístico de Madrid',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @Length(2, 200)
  location!: string;

  @ApiPropertyOptional({ example: 'Clasificado para reparto', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
