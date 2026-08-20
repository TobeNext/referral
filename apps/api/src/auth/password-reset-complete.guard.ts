import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.types';

@Injectable()
export class PasswordResetCompleteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user.mustResetPassword) {
      throw new ForbiddenException({ code: 'PASSWORD_RESET_REQUIRED', message: '首次登录需要先重置密码' });
    }
    return true;
  }
}
