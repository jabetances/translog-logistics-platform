import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'supervisor@translog.es', maxLength: 254 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
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
