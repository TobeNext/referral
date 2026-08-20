import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { Referral } from './referral.entity';
import { User } from './user.entity';

@Entity('credit_transactions')
@Check('CHK_credit_transactions_amount', 'amount > 0')
export class CreditTransaction {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) userId: string;
  @Column({ type: 'varchar', length: 64, unique: true }) referralId: string;
  @Column({ type: 'varchar', length: 32 }) type: 'REFERRAL_REWARD';
  @Column({ type: 'integer' }) amount: number;
  @Column({ type: 'integer' }) balanceAfter: number;
  @CreateDateColumn({ type: 'datetime' }) createdAt: Date;
  @ManyToOne(() => User, (user) => user.creditTransactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @OneToOne(() => Referral, (referral) => referral.transaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'referralId' })
  referral: Referral;
}
