import { Check, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { CreditTransaction } from './credit-transaction.entity';
import { Invitation } from './invitation.entity';
import { User } from './user.entity';

@Entity('referrals')
@Check('CHK_referrals_reward_credits', 'rewardCredits > 0')
export class Referral {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) invitationId: string;
  @Column({ type: 'varchar', length: 64 }) inviterId: string;
  @Column({ type: 'varchar', length: 64, unique: true }) inviteeId: string;
  @Column({ type: 'integer' }) rewardCredits: number;
  @Column({ type: 'datetime' }) acceptedAt: Date;
  @ManyToOne(() => Invitation, (invitation) => invitation.referrals, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invitationId' }) invitation: Invitation;
  @ManyToOne(() => User, (user) => user.referrals, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inviterId' }) inviter: User;
  @OneToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inviteeId' }) invitee: User;
  @OneToOne(() => CreditTransaction, (transaction) => transaction.referral) transaction?: CreditTransaction;
}
