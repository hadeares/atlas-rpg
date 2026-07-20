import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCampaignInviteCode1784565551898 implements MigrationInterface {
  name = 'AddCampaignInviteCode1784565551898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "campaigns" ADD COLUMN "inviteCode" character varying(12)`);
    await queryRunner.query(`ALTER TABLE "campaigns" ADD CONSTRAINT "UQ_campaigns_invite_code" UNIQUE ("inviteCode")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT "UQ_campaigns_invite_code"`);
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "inviteCode"`);
  }
}
