import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { databaseConfig } from './database/database.config';
import { DatabaseModule } from './database/database.module';
import { DemoModule } from './demo/demo.module';
import { HealthModule } from './health/health.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ReferralsModule } from './referrals/referrals.module';
import { UsersModule } from './users/users.module';

@Module({ imports: [TypeOrmModule.forRoot(databaseConfig()), DatabaseModule, HealthModule, UsersModule, DemoModule, InvitationsModule, ReferralsModule] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void { consumer.apply(RequestIdMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL }); }
}
