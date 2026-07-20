import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Índices parciais para acelerar as varreduras de manutenção que rodam no boot
 * (HexesService.initializeHexData): migrar lore desatualizada e normalizar a
 * névoa de guerra. Como são parciais, o índice praticamente desaparece assim
 * que todos os hexágonos já estiverem migrados/normalizados.
 */
export class AddHexMaintenanceIndexes1784563745675 implements MigrationInterface {
  name = 'AddHexMaintenanceIndexes1784563745675';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_hexes_needs_lore_migration" ON "hexes" ("id")
      WHERE (COALESCE((state->'lore'->>'schemaVersion')::integer, 0) < 5)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_hexes_sighted_unvisited" ON "hexes" ("id")
      WHERE ("discoveryStatus" = 'AVISTADO')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_hexes_sighted_unvisited"`);
    await queryRunner.query(`DROP INDEX "IDX_hexes_needs_lore_migration"`);
  }
}
