import { IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
export class CreateShipmentDto {
  @IsString() @Length(3, 240) originAddress!: string;
  @IsString() @Length(3, 240) destinationAddress!: string;
  @IsString() @Length(2, 160) recipientName!: string;
  @IsOptional() @IsString() @Length(5, 40) contactPhone?: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(100000) weightKg!: number;
}
