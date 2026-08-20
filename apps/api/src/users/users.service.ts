import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, Referral, User } from '../database/entities';
import { ReferralSummaryDto } from './referral-summary.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Invitation) private readonly invitations: Repository<Invitation>,
    @InjectRepository(Referral) private readonly referrals: Repository<Referral>
  ) {}

  async getReferralSummary(id: string): Promise<ReferralSummaryDto> {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    const [invitation, total, newest] = await Promise.all([
      this.invitations.findOneBy({ inviterId: id }),
      this.referrals.countBy({ inviterId: id }),
      this.referrals.find({ where: { inviterId: id }, relations: { invitee: true }, order: { acceptedAt: 'DESC' }, take: 100 })
    ]);
    const baseUrl = (process.env.PUBLIC_WEB_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      creditBalance: user.creditBalance,
      successfulReferralCount: total,
      invitation: invitation ? { token: invitation.token, publicUrl: `${baseUrl}/i/${invitation.token}` } : null,
      referrals: newest.map((referral) => ({
        id: referral.id,
        inviteeName: referral.invitee.name,
        rewardCredits: referral.rewardCredits,
        acceptedAt: referral.acceptedAt.toISOString()
      })),
      hasMore: total > 100
    };
  }
}
