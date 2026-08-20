import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1755660000000 implements MigrationInterface {
  name = 'InitialSchema1755660000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar(64) PRIMARY KEY NOT NULL, "name" varchar(80) NOT NULL, "email" varchar(254) NOT NULL, "creditBalance" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "CHK_users_credit_balance" CHECK ("creditBalance" >= 0))`
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" varchar(64) PRIMARY KEY NOT NULL, "code" char(6) NOT NULL, "inviterId" varchar(64) NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_invitations_code" UNIQUE ("code"), CONSTRAINT "UQ_invitations_inviter" UNIQUE ("inviterId"), CONSTRAINT "FK_invitations_inviter" FOREIGN KEY ("inviterId") REFERENCES "users" ("id") ON DELETE CASCADE)`
    );
    await queryRunner.query(
      `CREATE TABLE "referrals" ("id" varchar(64) PRIMARY KEY NOT NULL, "invitationId" varchar(64) NOT NULL, "inviterId" varchar(64) NOT NULL, "inviteeId" varchar(64) NOT NULL, "rewardCredits" integer NOT NULL, "acceptedAt" datetime NOT NULL, CONSTRAINT "UQ_referrals_invitee" UNIQUE ("inviteeId"), CONSTRAINT "CHK_referrals_reward_credits" CHECK ("rewardCredits" > 0), CONSTRAINT "FK_referrals_invitation" FOREIGN KEY ("invitationId") REFERENCES "invitations" ("id") ON DELETE RESTRICT, CONSTRAINT "FK_referrals_inviter" FOREIGN KEY ("inviterId") REFERENCES "users" ("id") ON DELETE RESTRICT, CONSTRAINT "FK_referrals_invitee" FOREIGN KEY ("inviteeId") REFERENCES "users" ("id") ON DELETE RESTRICT)`
    );
    await queryRunner.query(
      `CREATE TABLE "credit_transactions" ("id" varchar(64) PRIMARY KEY NOT NULL, "userId" varchar(64) NOT NULL, "referralId" varchar(64) NOT NULL, "type" varchar(32) NOT NULL, "amount" integer NOT NULL, "balanceAfter" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_credit_transactions_referral" UNIQUE ("referralId"), CONSTRAINT "CHK_credit_transactions_amount" CHECK ("amount" > 0), CONSTRAINT "FK_credit_transactions_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT, CONSTRAINT "FK_credit_transactions_referral" FOREIGN KEY ("referralId") REFERENCES "referrals" ("id") ON DELETE RESTRICT)`
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "credit_transactions"');
    await queryRunner.query('DROP TABLE "referrals"');
    await queryRunner.query('DROP TABLE "invitations"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
