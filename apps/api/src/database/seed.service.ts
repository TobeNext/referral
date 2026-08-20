import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async onApplicationBootstrap(): Promise<void> {
    const id = process.env.DEMO_INVITER_ID || 'usr_alice';
    const existing = await this.users.findOneBy({ id });
    if (existing) {
      this.logger.log(JSON.stringify({ event: 'seed.alice.reused', userId: id }));
      return;
    }
    await this.users.insert({ id, name: 'Alice', email: 'alice@example.com', creditBalance: 0 });
    this.logger.log(JSON.stringify({ event: 'seed.alice.created', userId: id }));
  }
}
