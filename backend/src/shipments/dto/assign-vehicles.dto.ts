import { ArrayNotEmpty, ArrayUnique, IsArray, IsNumber, IsUUID, Max, Min } from 'class-validator';
export class AssignVehiclesDto {
  @IsArray() @ArrayNotEmpty() @ArrayUnique() @IsUUID('4', { each: true }) shipmentIds!: string[];
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(100000) vehicleCapacity!: number;
}
