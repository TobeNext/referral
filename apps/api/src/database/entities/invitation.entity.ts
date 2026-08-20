import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Referral } from './referral.entity';
import { User } from './user.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 12, unique: true }) token: string;
  @Column({ type: 'varchar', length: 64, unique: true }) inviterId: string;
  @OneToOne(() => User, (user) => user.invitation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviterId' })
  inviter: User;
  @CreateDateColumn({ type: 'datetime' }) createdAt: Date;
  @OneToMany(() => Referral, (referral) => referral.invitation) referrals?: Referral[];
}
