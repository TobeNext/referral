import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation, User } from '../database/entities';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({ imports: [TypeOrmModule.forFeature([Invitation, User])], controllers: [InvitationsController], providers: [InvitationsService], exports: [InvitationsService] })
export class InvitationsModule {}
