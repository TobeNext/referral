import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities';
import { SeedService } from './seed.service';

describe('SeedService', () => {
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
});
