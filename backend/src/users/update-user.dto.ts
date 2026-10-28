import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from "class-validator";
import { UserRole } from "./user.entity.js";

export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
