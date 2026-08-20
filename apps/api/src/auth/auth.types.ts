import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  mustResetPassword: boolean;
  authVersion: number;
};

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };

export type JwtClaims = {
  sub: string;
  email: string;
  mustResetPassword: boolean;
  authVersion: number;
};
