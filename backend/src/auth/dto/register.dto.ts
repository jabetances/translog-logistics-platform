import { IsEmail, IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { UserRole } from '../../users/user.entity.js';
export class RegisterDto { @IsEmail() @MaxLength(254) email!: string; @IsString() @Length(10, 100) password!: string; @IsString() @Length(2, 120) fullName!: string; @IsEnum(UserRole) role!: UserRole; }
