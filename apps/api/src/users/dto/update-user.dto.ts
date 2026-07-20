import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
