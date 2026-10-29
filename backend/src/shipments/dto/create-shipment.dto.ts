import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  registerDecorator,
} from 'class-validator';
import type { ValidationOptions } from 'class-validator';

function isValidContactPhone(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\+?[0-9\s().-]+$/.test(value))
    return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function IsContactPhone(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'isContactPhone',
      target: target.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message:
          validationOptions?.message ??
          'El teléfono debe tener entre 7 y 15 cifras; puedes usar +, espacios, paréntesis o guiones.',
      },
      validator: { validate: isValidContactPhone },
    });
  };
}

export class CreateShipmentDto {
  @ApiProperty({
    example: 'Calle Mayor 1, Madrid',
    minLength: 3,
    maxLength: 240,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 240)
  originAddress!: string;

  @ApiProperty({ example: 'Gran Vía 20, Madrid', minLength: 3, maxLength: 240 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 240)
  destinationAddress!: string;

  @ApiProperty({ example: 'Ana Pérez', minLength: 2, maxLength: 160 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 160)
  recipientName!: string;

  @ApiPropertyOptional({
    example: '+34 600 123 456',
    maxLength: 40,
    description:
      'Opcional; entre 7 y 15 cifras. Se permiten +, espacios, paréntesis y guiones.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @IsContactPhone()
  contactPhone?: string;

  @ApiProperty({
    example: 12.5,
    minimum: 0.001,
    maximum: 100000,
    description: 'Peso en kilogramos; hasta tres decimales.',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(100000)
  weightKg!: number;
}
