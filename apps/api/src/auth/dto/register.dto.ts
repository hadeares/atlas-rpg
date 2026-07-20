import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 120)
  displayName: string;

  @IsString()
  @MinLength(8)
  password: string;
}
