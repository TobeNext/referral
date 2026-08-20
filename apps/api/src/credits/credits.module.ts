import { Module } from '@nestjs/common';

export const REFERRAL_REWARD = Symbol('REFERRAL_REWARD');

@Module({
  providers: [{ provide: REFERRAL_REWARD, useFactory: () => Number(process.env.REFERRAL_REWARD_CREDITS || 100) }],
  exports: [REFERRAL_REWARD]
})
export class CreditsModule {}
