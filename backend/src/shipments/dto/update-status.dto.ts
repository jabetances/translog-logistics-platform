import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 200)
  location!: string;

  @ApiPropertyOptional({ example: 'Clasificado para reparto', maxLength: 2000 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
