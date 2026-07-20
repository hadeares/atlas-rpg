import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEncounterCombatTracker1784565171167 implements MigrationInterface {
  name = 'AddEncounterCombatTracker1784565171167';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "random_encounters"
      ADD COLUMN "initiativeOrder" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN "combatRound" integer NOT NULL DEFAULT 0,
      ADD COLUMN "currentTurnIndex" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "random_encounters"
      DROP COLUMN "currentTurnIndex",
      DROP COLUMN "combatRound",
      DROP COLUMN "initiativeOrder"
    `);
  }
}
