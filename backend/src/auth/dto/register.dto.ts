import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { UserRole } from '../../users/user.entity.js';

export class RegisterDto {
  @ApiProperty({ example: 'operador@translog.es', maxLength: 254 })
  @IsEmail() @MaxLength(254) email!: string;

  @ApiProperty({ minLength: 10, maxLength: 100, description: 'Define una contraseña de al menos 10 caracteres.' })
  @IsString() @Length(10, 100) password!: string;

  @ApiProperty({ example: 'Ana Pérez', minLength: 2, maxLength: 120 })
  @IsString() @Length(2, 120) fullName!: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', example: UserRole.OPERATOR })
  @IsEnum(UserRole) role!: UserRole;
}
