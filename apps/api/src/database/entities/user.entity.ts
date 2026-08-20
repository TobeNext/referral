import { Check, Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CreditTransaction } from './credit-transaction.entity';
import { Invitation } from './invitation.entity';
import { Referral } from './referral.entity';

@Entity('users')
@Check('CHK_users_credit_balance', 'creditBalance >= 0')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'varchar', length: 254, unique: true }) email: string;
  @Column({ type: 'integer', default: 0 }) creditBalance: number;
  @CreateDateColumn({ type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ type: 'datetime' }) updatedAt: Date;
  @OneToOne(() => Invitation, (invitation) => invitation.inviter) invitation?: Invitation;
  @OneToMany(() => Referral, (referral) => referral.inviter) referrals?: Referral[];
  @OneToMany(() => CreditTransaction, (transaction) => transaction.user) creditTransactions?: CreditTransaction[];
}
