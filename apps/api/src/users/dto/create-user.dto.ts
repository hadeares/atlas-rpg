import { IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 120)
  displayName: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
