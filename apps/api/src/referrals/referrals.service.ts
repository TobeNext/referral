import { ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, QueryFailedError } from 'typeorm';
import { REFERRAL_REWARD } from '../credits/credits.module';
import { CreditTransaction, Invitation, Referral, User } from '../database/entities';
import { AcceptInvitationDto, AcceptInvitationResultDto } from './accept-invitation.dto';

type TestOptions = { failBeforeCreditTransaction?: boolean };

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  private acceptanceQueue: Promise<void> = Promise.resolve();
  constructor(private readonly dataSource: DataSource, @Inject(REFERRAL_REWARD) private readonly rewardCredits: number) {}

  async acceptInvitation(code: string, input: AcceptInvitationDto, requestId?: string, testOptions?: TestOptions): Promise<AcceptInvitationResultDto> {
    const previous = this.acceptanceQueue;
    let release!: () => void;
    this.acceptanceQueue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    this.logger.log(JSON.stringify({ event: 'referral.accept.started', requestId, invitationCode: code.toUpperCase() }));
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const invitation = await manager.findOne(Invitation, { where: { code: code.trim().toUpperCase() }, relations: { inviter: true } });
        if (!invitation) throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: '邀请链接无效' });
        const email = input.email.trim().toLowerCase();
        if (await manager.existsBy(User, { email })) throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED', message: '该邮箱已注册' });

        const now = new Date();
        const user = manager.create(User, { id: `usr_${randomUUID()}`, name: input.name.trim(), email, creditBalance: 0 });
        await manager.save(User, user);
        const referral = manager.create(Referral, { id: `ref_${randomUUID()}`, invitationId: invitation.id, inviterId: invitation.inviterId, inviteeId: user.id, rewardCredits: this.rewardCredits, acceptedAt: now });
        await manager.save(Referral, referral);
        await manager.increment(User, { id: invitation.inviterId }, 'creditBalance', this.rewardCredits);
        const inviterAfter = await manager.findOneByOrFail(User, { id: invitation.inviterId });
        if (testOptions?.failBeforeCreditTransaction) throw new Error('Injected credit transaction failure');
        await manager.save(CreditTransaction, manager.create(CreditTransaction, { id: `ctx_${randomUUID()}`, userId: invitation.inviterId, referralId: referral.id, type: 'REFERRAL_REWARD', amount: this.rewardCredits, balanceAfter: inviterAfter.creditBalance }));

        return { user: { id: user.id, name: user.name, email: user.email }, referral: { id: referral.id, inviterName: invitation.inviter.name, rewardCredits: referral.rewardCredits, acceptedAt: now.toISOString() } };
      });
      this.logger.log(JSON.stringify({ event: 'referral.accept.committed', requestId, referralId: result.referral.id, rewardCredits: result.referral.rewardCredits }));
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.warn(JSON.stringify({ event: 'referral.accept.rejected', requestId, code: (error.getResponse() as Record<string, unknown>).code || 'HTTP_ERROR' }));
        throw error;
      }
      if (error instanceof QueryFailedError && /UNIQUE constraint failed: users\.email/i.test(error.message)) {
        this.logger.warn(JSON.stringify({ event: 'referral.accept.rejected', requestId, code: 'EMAIL_ALREADY_REGISTERED' }));
        throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED', message: '该邮箱已注册' });
      }
      this.logger.error(JSON.stringify({ event: 'referral.accept.rolled_back', requestId, errorType: error instanceof Error ? error.name : 'UnknownError' }));
      throw new InternalServerErrorException({ code: 'REFERRAL_ACCEPT_FAILED', message: '注册失败，请稍后重试' });
    } finally {
      release();
    }
  }
}
