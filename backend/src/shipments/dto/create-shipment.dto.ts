import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Calle Mayor 1, Madrid', minLength: 3, maxLength: 240 })
  @IsString() @Length(3, 240) originAddress!: string;

  @ApiProperty({ example: 'Gran Vía 20, Madrid', minLength: 3, maxLength: 240 })
  @IsString() @Length(3, 240) destinationAddress!: string;

  @ApiProperty({ example: 'Ana Pérez', minLength: 2, maxLength: 160 })
  @IsString() @Length(2, 160) recipientName!: string;

  @ApiPropertyOptional({ example: '+34 600 123 456', minLength: 5, maxLength: 40 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value)
  @IsOptional() @IsString() @Length(5, 40) contactPhone?: string;

  @ApiProperty({ example: 12.5, minimum: 0.001, maximum: 100000, description: 'Peso en kilogramos; hasta tres decimales.' })
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(100000) weightKg!: number;
}
