import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { User } from './entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async onApplicationBootstrap(): Promise<void> {
    const id = process.env.DEMO_INVITER_ID || 'usr_alice';
    const existing = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.id = :id', { id }).getOne();
    if (existing) {
      if (!existing.passwordHash) {
        const passwordHash = await hash(process.env.DEMO_INVITER_PASSWORD || 'AliceDemo1234', 10);
        await this.users.update({ id }, { passwordHash, mustResetPassword: false });
        this.logger.log(JSON.stringify({ event: 'seed.alice.credentials_initialized', userId: id }));
        return;
      }
      this.logger.log(JSON.stringify({ event: 'seed.alice.reused', userId: id }));
      return;
    }
    const passwordHash = await hash(process.env.DEMO_INVITER_PASSWORD || 'AliceDemo1234', 10);
    await this.users.insert({ id, name: 'Alice', email: 'alice@example.com', passwordHash, mustResetPassword: false, authVersion: 0, creditBalance: 0 });
    this.logger.log(JSON.stringify({ event: 'seed.alice.created', userId: id }));
  }
}
