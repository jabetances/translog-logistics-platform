import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'supervisor@translog.es' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 100,
    description: 'Contraseña de la cuenta.',
  })
  @IsString()
  @Length(1, 100)
  password!: string;
}
