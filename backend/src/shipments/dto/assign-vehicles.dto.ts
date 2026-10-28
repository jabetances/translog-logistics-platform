import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AssignVehiclesDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    uniqueItems: true,
    example: ['123e4567-e89b-42d3-a456-426614174000'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  shipmentIds!: string[];

  @ApiProperty({
    example: 100,
    minimum: 0.001,
    maximum: 100000,
    description: 'Capacidad del vehículo en kilogramos.',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(100000)
  vehicleCapacity!: number;
}
