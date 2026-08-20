import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomBytes } from 'node:crypto';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomToken(length = 12): string {
  return Array.from(randomBytes(length), (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join('');
}

export class AuthAndShortToken1755661000000 implements MigrationInterface {
  name = 'AuthAndShortToken1755661000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "invitations" RENAME COLUMN "code" TO "token"');
    const invitations = await queryRunner.query('SELECT "id" FROM "invitations"') as Array<{ id: string }>;
    for (const invitation of invitations) {
      let updated = false;
      while (!updated) {
        try {
          await queryRunner.query('UPDATE "invitations" SET "token" = ? WHERE "id" = ?', [randomToken(), invitation.id]);
          updated = true;
        } catch (error) {
          if (!(error instanceof Error) || !/UNIQUE constraint failed/i.test(error.message)) throw error;
        }
      }
    }
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "passwordHash" varchar(255)');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "mustResetPassword" boolean NOT NULL DEFAULT (1)');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "authVersion" integer NOT NULL DEFAULT (0)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "authVersion"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "mustResetPassword"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "passwordHash"');
    const invitations = await queryRunner.query('SELECT "id" FROM "invitations"') as Array<{ id: string }>;
    for (const invitation of invitations) {
      let updated = false;
      while (!updated) {
        try {
          await queryRunner.query('UPDATE "invitations" SET "token" = ? WHERE "id" = ?', [randomToken(6), invitation.id]);
          updated = true;
        } catch (error) {
          if (!(error instanceof Error) || !/UNIQUE constraint failed/i.test(error.message)) throw error;
        }
      }
    }
    await queryRunner.query('ALTER TABLE "invitations" RENAME COLUMN "token" TO "code"');
  }
}
