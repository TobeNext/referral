import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : '')
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 1, maxLength: 72, writeOnly: true })
  @IsString()
  @Length(1, 72)
  password: string;
}

export class ResetPasswordDto {
  @ApiProperty({ maxLength: 72, writeOnly: true })
  @IsString()
  @Length(1, 72)
  currentPassword: string;

  @ApiProperty({ minLength: 10, maxLength: 72, writeOnly: true })
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  newPassword: string;

  @ApiProperty({ minLength: 10, maxLength: 72, writeOnly: true })
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  confirmPassword: string;
}

export class AuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ format: 'email' }) email: string;
  @ApiProperty() mustResetPassword: boolean;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ type: AuthUserDto }) user: AuthUserDto;
}
