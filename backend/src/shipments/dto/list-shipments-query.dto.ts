import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ShipmentStatus } from '../domain/shipment-status.js';

export const SHIPMENT_SORT_FIELDS = [
  'trackingCode',
  'recipientName',
  'destinationAddress',
  'status',
  'createdAt',
] as const;

export type ShipmentSortField = (typeof SHIPMENT_SORT_FIELDS)[number];
export type ShipmentSortDirection = 'ASC' | 'DESC';

export class ListShipmentsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: ShipmentStatus })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: SHIPMENT_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(SHIPMENT_SORT_FIELDS)
  sortBy: ShipmentSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(['ASC', 'DESC'])
  sortDirection: ShipmentSortDirection = 'DESC';
}
