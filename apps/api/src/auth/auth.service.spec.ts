import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import { CreditTransaction, Invitation, Referral, User } from '../database/entities';
import { InitialSchema1755660000000 } from '../database/migrations/1755660000000-initial-schema';
import { AuthAndShortToken1755661000000 } from '../database/migrations/1755661000000-auth-and-short-token';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let dataSource: DataSource;
  let service: AuthService;

  beforeEach(async () => {
    dataSource = new DataSource({ type: 'better-sqlite3', database: ':memory:', entities: [User, Invitation, Referral, CreditTransaction], migrations: [InitialSchema1755660000000, AuthAndShortToken1755661000000], migrationsRun: true, synchronize: false });
    await dataSource.initialize();
    await dataSource.getRepository(User).insert({ id: 'usr_bob', name: 'Bob', email: 'bob@example.com', passwordHash: await hash('Temporary123', 4), mustResetPassword: true, authVersion: 0, creditBalance: 0 });
    service = new AuthService(dataSource.getRepository(User), new JwtService({ secret: 'test-secret-at-least-32-characters-long', signOptions: { expiresIn: '30m' } }));
  });

  afterEach(async () => { if (dataSource.isInitialized) await dataSource.destroy(); });

  it('returns the same generic error for unknown email and wrong password', async () => {
    await expect(service.login({ email: 'unknown@example.com', password: 'anything' })).rejects.toMatchObject({ response: { code: 'INVALID_CREDENTIALS' } });
    await expect(service.login({ email: 'bob@example.com', password: 'wrong' })).rejects.toMatchObject({ response: { code: 'INVALID_CREDENTIALS' } });
  });

  it('issues a restricted token then invalidates it after password reset', async () => {
    const login = await service.login({ email: 'bob@example.com', password: 'Temporary123' });
    expect(login.user.mustResetPassword).toBe(true);
    const oldClaims = new JwtService({ secret: 'test-secret-at-least-32-characters-long' }).verify(login.accessToken);
    expect(await service.findAuthenticatedUser(oldClaims)).not.toBeNull();

    const reset = await service.resetPassword({ id: 'usr_bob', name: 'Bob', email: 'bob@example.com', mustResetPassword: true, authVersion: 0 }, { currentPassword: 'Temporary123', newPassword: 'Permanent456', confirmPassword: 'Permanent456' });
    expect(reset.user.mustResetPassword).toBe(false);
    expect(await service.findAuthenticatedUser(oldClaims)).toBeNull();
    await expect(service.login({ email: 'bob@example.com', password: 'Permanent456' })).resolves.toMatchObject({ user: { mustResetPassword: false } });
  });

  it('rejects mismatched and weak new passwords', async () => {
    const user = { id: 'usr_bob', name: 'Bob', email: 'bob@example.com', mustResetPassword: true, authVersion: 0 };
    await expect(service.resetPassword(user, { currentPassword: 'Temporary123', newPassword: 'LettersOnly', confirmPassword: 'LettersOnly' })).rejects.toMatchObject({ response: { code: 'PASSWORD_TOO_WEAK' } });
    await expect(service.resetPassword(user, { currentPassword: 'Temporary123', newPassword: 'ValidValue123', confirmPassword: 'Different123' })).rejects.toMatchObject({ response: { code: 'PASSWORD_CONFIRMATION_MISMATCH' } });
  });
});
