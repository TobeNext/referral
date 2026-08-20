import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  afterEach(() => {
    delete process.env.DEMO_INVITER_ID;
    delete process.env.DEMO_INVITER_PASSWORD;
  });

  it('creates Alice once and reuses her on the next startup', async () => {
    let alice: Partial<User> | null = null;
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => alice)
    };
    const repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      insert: jest.fn(async (value: Partial<User>) => {
        alice = value;
        return {} as never;
      })
    };
    const module = await Test.createTestingModule({
      providers: [SeedService, { provide: getRepositoryToken(User), useValue: repository }]
    }).compile();
    const service = module.get(SeedService);
    await service.onApplicationBootstrap();
    await service.onApplicationBootstrap();
    expect(repository.insert).toHaveBeenCalledTimes(1);
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'usr_alice', email: 'alice@example.com', mustResetPassword: false })
    );
  });

  it('initializes missing credentials for a configured legacy inviter', async () => {
    process.env.DEMO_INVITER_ID = 'usr_legacy';
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'usr_legacy', passwordHash: null })
    };
    const repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      update: jest.fn().mockResolvedValue({}),
      insert: jest.fn()
    };
    const module = await Test.createTestingModule({
      providers: [SeedService, { provide: getRepositoryToken(User), useValue: repository }]
    }).compile();

    await module.get(SeedService).onApplicationBootstrap();

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'usr_legacy' },
      { passwordHash: expect.stringMatching(/^\$2[aby]\$/), mustResetPassword: false }
    );
    expect(repository.insert).not.toHaveBeenCalled();
  });
});
