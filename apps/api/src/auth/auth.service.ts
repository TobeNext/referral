import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../database/entities';
import { AuthResponseDto, LoginDto, ResetPasswordDto } from './auth.dto';
import { AuthenticatedUser, JwtClaims } from './auth.types';

const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8n0YQ39iYLMuxGdZrqPGKq7Gg1w72e';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService
  ) {}

  async login(input: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: input.email })
      .getOne();
    const matches = await compare(input.password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !matches) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: '账号或密码错误' });
    }
    return this.response(user);
  }

  async resetPassword(current: AuthenticatedUser, input: ResetPasswordDto): Promise<AuthResponseDto> {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException({ code: 'PASSWORD_CONFIRMATION_MISMATCH', message: '两次输入的新密码不一致' });
    }
    if (!/[A-Za-z]/.test(input.newPassword) || !/\d/.test(input.newPassword)) {
      throw new BadRequestException({ code: 'PASSWORD_TOO_WEAK', message: '新密码至少 10 位，并同时包含字母和数字' });
    }
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: current.id })
      .getOne();
    if (!user?.passwordHash || !(await compare(input.currentPassword, user.passwordHash))) {
      throw new BadRequestException({ code: 'CURRENT_PASSWORD_INVALID', message: '当前密码不正确' });
    }
    if (await compare(input.newPassword, user.passwordHash)) {
      throw new BadRequestException({ code: 'PASSWORD_REUSE_NOT_ALLOWED', message: '新密码不能与当前密码相同' });
    }
    user.passwordHash = await hash(input.newPassword, 10);
    user.mustResetPassword = false;
    user.authVersion += 1;
    await this.users.save(user);
    return this.response(user);
  }

  async findAuthenticatedUser(claims: JwtClaims): Promise<AuthenticatedUser | null> {
    const user = await this.users.findOneBy({ id: claims.sub });
    if (!user || user.authVersion !== claims.authVersion || user.mustResetPassword !== claims.mustResetPassword) return null;
    return { id: user.id, name: user.name, email: user.email, mustResetPassword: user.mustResetPassword, authVersion: user.authVersion };
  }

  response(user: User): AuthResponseDto {
    const claims: JwtClaims = { sub: user.id, email: user.email, mustResetPassword: user.mustResetPassword, authVersion: user.authVersion };
    return {
      accessToken: this.jwt.sign(claims),
      user: { id: user.id, name: user.name, email: user.email, mustResetPassword: user.mustResetPassword }
    };
  }
}
