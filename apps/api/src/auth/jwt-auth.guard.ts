import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, JwtClaims } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw this.unauthorized();
    const token = authorization.slice(7).trim();
    if (!token) throw this.unauthorized();
    try {
      const claims = await this.jwt.verifyAsync<JwtClaims>(token);
      const user = await this.auth.findAuthenticatedUser(claims);
      if (!user) throw this.unauthorized();
      request.user = user;
      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED', message: '登录状态已失效，请重新登录' });
  }
}
