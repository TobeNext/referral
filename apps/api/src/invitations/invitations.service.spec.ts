import { Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreditTransaction, Invitation, Referral, User } from '../database/entities';
import { InitialSchema1755660000000 } from '../database/migrations/1755660000000-initial-schema';
import { AuthAndShortToken1755661000000 } from '../database/migrations/1755661000000-auth-and-short-token';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let dataSource: DataSource;
  let service: InvitationsService;
  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [User, Invitation, Referral, CreditTransaction],
      migrations: [InitialSchema1755660000000, AuthAndShortToken1755661000000],
      migrationsRun: true,
      synchronize: false
    });
    await dataSource.initialize();
    await dataSource.getRepository(User).insert({ id: 'usr_alice', name: 'Alice', email: 'alice@example.com', creditBalance: 0 });
    service = new InvitationsService(dataSource.getRepository(Invitation), dataSource.getRepository(User));
  });
  afterEach(async () => {
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('creates once and reuses the same opaque token', async () => {
    const first = await service.createOrReuse('usr_alice', 'req-1');
    const second = await service.createOrReuse('usr_alice', 'req-2');
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.invitation.token).toBe(first.invitation.token);
    expect(first.invitation.token).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
    expect(first.invitation.publicUrl).toContain(`/i/${first.invitation.token}`);
    expect(await dataSource.getRepository(Invitation).count()).toBe(1);
  });

  it('returns one invitation for concurrent creation requests', async () => {
    const results = await Promise.all([
      service.createOrReuse('usr_alice', 'req-concurrent-a'),
      service.createOrReuse('usr_alice', 'req-concurrent-b')
    ]);
    expect(results[0].invitation.token).toBe(results[1].invitation.token);
    expect(await dataSource.getRepository(Invitation).count()).toBe(1);
  });

  it('returns only inviter public name', async () => {
    const created = await service.createOrReuse('usr_alice');
    await expect(service.getPublic(created.invitation.token)).resolves.toEqual({ inviter: { name: 'Alice' } });
  });

  it('rejects an invalid invitation', async () => {
    await expect(service.getPublic('BAD')).rejects.toMatchObject({ response: { code: 'INVITATION_NOT_FOUND' } });
  });

  it('rejects a missing user and a well-formed but unknown invitation', async () => {
    await expect(service.createOrReuse('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getPublic('ZZZ234ZZZ567')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fails safely after exhausting token insertion attempts', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const queryBuilder = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute
    };
    const invitations = {
      findOneBy: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn(() => queryBuilder)
    } as unknown as Repository<Invitation>;
    const users = { findOneBy: jest.fn().mockResolvedValue({ id: 'usr_alice' }) } as unknown as Repository<User>;
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(new InvitationsService(invitations, users).createOrReuse('usr_alice', 'req-exhausted')).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    expect(execute).toHaveBeenCalledTimes(5);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('invitation.token_exhausted'));
    error.mockRestore();
  });
});
