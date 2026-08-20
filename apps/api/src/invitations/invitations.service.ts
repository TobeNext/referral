import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { Invitation, User } from '../database/entities';
import { InvitationLinkDto, PublicInvitationDto } from './invitation.dto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
      const code = this.generateCode();
      await this.invitations.createQueryBuilder().insert().values({ id: `inv_${randomUUID()}`, code, inviterId: userId }).orIgnore().execute();
      const byInviter = await this.invitations.findOneBy({ inviterId: userId });
      if (byInviter) return this.result(byInviter, byInviter.code === code, requestId);
    }
    this.logger.error(JSON.stringify({ event: 'invitation.code_exhausted', requestId, inviterId: userId }));
    throw new ServiceUnavailableException({ code: 'INVITATION_CODE_EXHAUSTED', message: '暂时无法生成邀请码，请稍后重试' });
  }

  async getPublic(code: string): Promise<PublicInvitationDto> {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: '邀请链接无效' });
    const invitation = await this.invitations.findOne({ where: { code: normalized }, relations: { inviter: true } });
    if (!invitation) throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: '邀请链接无效' });
    return { code: invitation.code, inviter: { name: invitation.inviter.name } };
  }

  private result(invitation: Invitation, created: boolean, requestId?: string): { invitation: InvitationLinkDto; created: boolean } {
    const path = `/ref/${invitation.code}`;
    const baseUrl = (process.env.PUBLIC_WEB_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    this.logger.log(JSON.stringify({ event: created ? 'invitation.created' : 'invitation.reused', requestId, inviterId: invitation.inviterId, invitationId: invitation.id }));
    return { created, invitation: { code: invitation.code, path, publicUrl: `${baseUrl}${path}` } };
  }

  private generateCode(): string {
    const bytes = randomBytes(6);
    return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
  }
}
