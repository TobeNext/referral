import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordResetCompleteGuard } from './password-reset-complete.guard';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET || 'referral-demo-development-secret-32-chars';
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || secret.length < 32)) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production');
  }
  return secret;
}

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({ secret: jwtSecret(), signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '30m') as never } })],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PasswordResetCompleteGuard],
  exports: [JwtModule, AuthService, JwtAuthGuard, PasswordResetCompleteGuard]
})
export class AuthModule {}
