import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Invitation, User } from '../database/entities';
import { InvitationLinkDto, PublicInvitationDto } from './invitation.dto';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH = 12;

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  constructor(
    @InjectRepository(Invitation) private readonly invitations: Repository<Invitation>,
    @InjectRepository(User) private readonly users: Repository<User>
  ) {}

  async createOrReuse(userId: string, requestId?: string): Promise<{ invitation: InvitationLinkDto; created: boolean }> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    const existing = await this.invitations.findOneBy({ inviterId: userId });
    if (existing) return this.result(existing, false, requestId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = this.generateToken();
      await this.invitations.createQueryBuilder().insert().values({ id: `inv_${randomUUID()}`, token, inviterId: userId }).orIgnore().execute();
      const byInviter = await this.invitations.findOneBy({ inviterId: userId });
      if (byInviter) return this.result(byInviter, byInviter.token === token, requestId);
    }
    this.logger.error(JSON.stringify({ event: 'invitation.token_exhausted', requestId, inviterId: userId }));
    throw new ServiceUnavailableException({ code: 'INVITATION_TOKEN_EXHAUSTED', message: '暂时无法生成邀请链接，请稍后重试' });
  }

  async getPublic(token: string): Promise<PublicInvitationDto> {
    const normalized = token.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{12}$/.test(normalized)) throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: '邀请链接无效' });
    const invitation = await this.invitations.findOne({ where: { token: normalized }, relations: { inviter: true } });
    if (!invitation) throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: '邀请链接无效' });
    return { inviter: { name: invitation.inviter.name } };
  }

  private result(invitation: Invitation, created: boolean, requestId?: string): { invitation: InvitationLinkDto; created: boolean } {
    const path = `/i/${invitation.token}`;
    const baseUrl = (process.env.PUBLIC_WEB_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    this.logger.log(JSON.stringify({ event: created ? 'invitation.created' : 'invitation.reused', requestId, inviterId: invitation.inviterId, invitationId: invitation.id }));
    return { created, invitation: { token: invitation.token, path, publicUrl: `${baseUrl}${path}` } };
  }

  private generateToken(): string {
    const bytes = randomBytes(TOKEN_LENGTH);
    return Array.from(bytes, (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join('');
  }
}
