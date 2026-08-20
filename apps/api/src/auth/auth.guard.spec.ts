import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordResetCompleteGuard } from './password-reset-complete.guard';

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext;
}

describe('authentication guards', () => {
  const user: AuthenticatedUser = {
    id: 'usr_alice',
    name: 'Alice',
    email: 'alice@example.com',
    mustResetPassword: false,
    authVersion: 1
  };

  it.each([undefined, 'Basic abc', 'Bearer   '])('rejects a missing or malformed bearer token: %s', async (authorization) => {
    const jwt = { verifyAsync: jest.fn() } as unknown as JwtService;
    const auth = { findAuthenticatedUser: jest.fn() } as unknown as AuthService;
    const guard = new JwtAuthGuard(jwt, auth);
    await expect(guard.canActivate(contextFor({ headers: { authorization } }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the authenticated user for a valid token', async () => {
    const claims = { sub: user.id, email: user.email, mustResetPassword: false, authVersion: 1 };
    const jwt = { verifyAsync: jest.fn().mockResolvedValue(claims) } as unknown as JwtService;
    const findAuthenticatedUser = jest.fn().mockResolvedValue(user);
    const auth = { findAuthenticatedUser } as unknown as AuthService;
    const request = { headers: { authorization: 'Bearer valid-token' } } as Partial<AuthenticatedRequest>;
    const guard = new JwtAuthGuard(jwt, auth);
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual(user);
    expect(findAuthenticatedUser).toHaveBeenCalledWith(claims);
  });

  it.each([
    ['an invalid signature', jest.fn().mockRejectedValue(new Error('invalid')), jest.fn()],
    ['a stale user session', jest.fn().mockResolvedValue({ sub: user.id }), jest.fn().mockResolvedValue(null)]
  ])('rejects %s', async (_label, verifyAsync, findAuthenticatedUser) => {
    const guard = new JwtAuthGuard({ verifyAsync } as unknown as JwtService, { findAuthenticatedUser } as unknown as AuthService);
    await expect(guard.canActivate(contextFor({ headers: { authorization: 'Bearer token' } }))).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it('requires first-login password reset to be complete', () => {
    const guard = new PasswordResetCompleteGuard();
    expect(() => guard.canActivate(contextFor({ user: { ...user, mustResetPassword: true } }))).toThrow(ForbiddenException);
    expect(guard.canActivate(contextFor({ user }))).toBe(true);
  });
});
