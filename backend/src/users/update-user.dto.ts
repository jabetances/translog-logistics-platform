import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { IsAcceptablePassword } from '../auth/password-policy.js';
import { UserRole } from './user.entity.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ana Pérez', minLength: 2, maxLength: 120 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @ApiPropertyOptional({ example: 'ana@translog.es', maxLength: 254 })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    example: '••••••••••••',
    minLength: 12,
    maxLength: 72,
    description:
      'Frase única de al menos 12 caracteres, máximo 72 bytes UTF-8; sin requisitos artificiales de símbolos.',
    writeOnly: true,
  })
  @Transform(({ value }) => (value === null ? undefined : value))
  @IsOptional()
  @IsString()
  @IsAcceptablePassword()
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.OPERATOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
