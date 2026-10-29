import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { IsAcceptablePassword } from '../password-policy.js';
import { UserRole } from '../../users/user.entity.js';

export class RegisterDto {
  @ApiProperty({ example: 'operador@translog.es', maxLength: 254 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    minLength: 12,
    maxLength: 72,
    description:
      'Frase única de al menos 12 caracteres y máximo 72 bytes UTF-8. No se fuerzan símbolos ni mayúsculas.',
  })
  @IsString()
  @IsAcceptablePassword()
  password!: string;

  @ApiProperty({ example: 'Ana Pérez', minLength: 2, maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.OPERATOR,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
