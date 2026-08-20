import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CreditTransaction, Invitation, Referral, User } from './entities';
import { InitialSchema1755660000000 } from './migrations/1755660000000-initial-schema';

export function databaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || './referral.sqlite',
    entities: [User, Invitation, Referral, CreditTransaction],
    migrations: [InitialSchema1755660000000],
    migrationsRun: true,
    synchronize: false,
    enableWAL: true
  };
}
