import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreditTransaction, Invitation, Referral, User } from '../database/entities';
import { InitialSchema1755660000000 } from '../database/migrations/1755660000000-initial-schema';
import { AuthAndShortToken1755661000000 } from '../database/migrations/1755661000000-auth-and-short-token';
import { ReferralsService } from './referrals.service';

describe('ReferralsService', () => {
  let dataSource: DataSource;
  let service: ReferralsService;
  beforeEach(async () => {
    dataSource = new DataSource({ type: 'better-sqlite3', database: ':memory:', entities: [User, Invitation, Referral, CreditTransaction], migrations: [InitialSchema1755660000000, AuthAndShortToken1755661000000], migrationsRun: true, synchronize: false });
    await dataSource.initialize();
    await dataSource.getRepository(User).insert({ id: 'usr_alice', name: 'Alice', email: 'alice@example.com', creditBalance: 0 });
    await dataSource.getRepository(Invitation).insert({ id: 'inv_alice', token: 'ABC234DEF567', inviterId: 'usr_alice' });
    service = new ReferralsService(dataSource, 100);
  });
  afterEach(async () => { if (dataSource.isInitialized) await dataSource.destroy(); });

  it('awards Bob once and rejects a duplicate without changing counts', async () => {
    const result = await service.acceptInvitation('abc234def567', { name: ' Bob ', email: ' BOB@EXAMPLE.COM ' }, 'req-bob');
    expect(result).toMatchObject({ user: { name: 'Bob', email: 'bob@example.com' }, referral: { inviterName: 'Alice', rewardCredits: 100 } });
    expect(result.temporaryPassword).toMatch(/^[A-Za-z0-9_-]{10,72}$/);
    const bobWithHash = await dataSource.getRepository(User).createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email: 'bob@example.com' }).getOneOrFail();
    expect(bobWithHash.passwordHash).not.toBe(result.temporaryPassword);
    expect(bobWithHash.mustResetPassword).toBe(true);
    await expect(service.acceptInvitation('ABC234DEF567', { name: 'Bob Again', email: 'bob@example.com' }, 'req-duplicate')).rejects.toBeInstanceOf(ConflictException);
    await expectCounts({ users: 2, referrals: 1, transactions: 1, balance: 100 });
  });

  it('accumulates Bob and Charlie rewards to 200', async () => {
    await service.acceptInvitation('ABC234DEF567', { name: 'Bob', email: 'bob@example.com' });
    await service.acceptInvitation('ABC234DEF567', { name: 'Charlie', email: 'charlie@example.com' });
    await expectCounts({ users: 3, referrals: 2, transactions: 2, balance: 200 });
  });

  it('rolls back user, referral and balance when credit transaction fails', async () => {
    await expect(service.acceptInvitation('ABC234DEF567', { name: 'Bob', email: 'bob@example.com' }, 'req-fail', { failBeforeCreditTransaction: true })).rejects.toBeInstanceOf(InternalServerErrorException);
    await expectCounts({ users: 1, referrals: 0, transactions: 0, balance: 0 });
  });

  it('accepts only one of two concurrent submissions for the same email', async () => {
    const settled = await Promise.allSettled([
      service.acceptInvitation('ABC234DEF567', { name: 'Bob', email: 'bob@example.com' }, 'req-a'),
      service.acceptInvitation('ABC234DEF567', { name: 'Bob', email: 'BOB@example.com' }, 'req-b')
    ]);
    expect(settled.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(settled.filter((item) => item.status === 'rejected')).toHaveLength(1);
    await expectCounts({ users: 2, referrals: 1, transactions: 1, balance: 100 });
  });

  async function expectCounts(expected: { users: number; referrals: number; transactions: number; balance: number }) {
    expect(await dataSource.getRepository(User).count()).toBe(expected.users);
    expect(await dataSource.getRepository(Referral).count()).toBe(expected.referrals);
    expect(await dataSource.getRepository(CreditTransaction).count()).toBe(expected.transactions);
    expect((await dataSource.getRepository(User).findOneByOrFail({ id: 'usr_alice' })).creditBalance).toBe(expected.balance);
  }
});
