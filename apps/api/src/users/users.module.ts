import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation, Referral, User } from '../database/entities';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({ imports: [TypeOrmModule.forFeature([User, Invitation, Referral])], controllers: [UsersController], providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
