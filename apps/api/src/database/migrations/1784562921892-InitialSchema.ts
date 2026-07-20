import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784562921892 implements MigrationInterface {
  name = 'InitialSchema1784562921892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`CREATE TYPE "public"."day_period_enum" AS ENUM('MANHA', 'TARDE', 'ANOITECER', 'NOITE')`);
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'USER')`);
    await queryRunner.query(`CREATE TYPE "public"."campaign_members_role_enum" AS ENUM('MASTER', 'PLAYER')`);
    await queryRunner.query(`CREATE TYPE "public"."hexes_terrain_enum" AS ENUM('PLANICIE', 'FLORESTA', 'FLORESTA_DENSA', 'COLINA', 'MONTANHA', 'PANTANO', 'REGIAO_ALAGADA', 'RUINAS', 'CAMPO_DEVASTADO', 'REGIAO_CONTAMINADA')`);
    await queryRunner.query(`CREATE TYPE "public"."hexes_biome_enum" AS ENUM('CAMPOS_CINZENTOS', 'BOSQUE_MORTO', 'MATA_PALIDA', 'TERRAS_ALTAS', 'PICOS_NEGROS', 'BREJO_SILENCIOSO', 'AGUAS_MORTAS', 'CICATRIZ_ANTIGA', 'ERMO_DE_CINZAS', 'ZONA_DA_FERIDA')`);
    await queryRunner.query(`CREATE TYPE "public"."hexes_discoveryStatus_enum" AS ENUM('DESCONHECIDO', 'AVISTADO', 'ATRAVESSADO', 'EXPLORADO', 'MAPEADO')`);
    await queryRunner.query(`CREATE TYPE "public"."creature_source_enum" AS ENUM('SRD', 'ORIGINAL', 'CUSTOM')`);
    await queryRunner.query(`CREATE TYPE "public"."creature_theme_enum" AS ENUM('STANDARD', 'RANDOM', 'COSMIC', 'INFECTED')`);
    await queryRunner.query(`CREATE TYPE "public"."random_encounter_status_enum" AS ENUM('RASCUNHO', 'PREPARADO', 'ATIVO', 'CONCLUIDO', 'IGNORADO', 'CANCELADO')`);
    await queryRunner.query(`CREATE TYPE "public"."random_encounter_category_enum" AS ENUM('ALEATORIO', 'CRIATURA', 'MONSTRO', 'HORROR', 'SOCIAL', 'VIAJANTE', 'FACCAO', 'DESCOBERTA', 'VESTIGIO', 'PERIGO_NATURAL', 'CLIMA', 'RECURSO', 'RUINA', 'RUMOR', 'CONSEQUENCIA')`);
    await queryRunner.query(`CREATE TYPE "public"."random_encounter_intensity_enum" AS ENUM('QUALQUER', 'TRANQUILA', 'CURIOSA', 'PREOCUPANTE', 'PERIGOSA', 'MORTAL')`);
    await queryRunner.query(`CREATE TYPE "public"."random_encounter_combat_enum" AS ENUM('QUALQUER', 'SEM_COMBATE', 'COMBATE_POSSIVEL', 'COMBATE_PROVAVEL', 'APENAS_SINAIS')`);
    await queryRunner.query(`CREATE TYPE "public"."random_encounter_relation_enum" AS ENUM('LORE_EXISTENTE', 'NOVO_COMPATIVEL', 'RUMOR', 'MONSTRO_LOCAL', 'HORROR_LOCAL', 'FACCAO')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "displayName" character varying(120) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(160) NOT NULL,
        "description" text,
        "seed" character varying(120) NOT NULL,
        "radius" integer NOT NULL DEFAULT 6,
        "currentDay" integer NOT NULL DEFAULT 1,
        "currentPeriod" "public"."day_period_enum" NOT NULL DEFAULT 'MANHA',
        "currentQ" integer NOT NULL DEFAULT 0,
        "currentR" integer NOT NULL DEFAULT 0,
        "version" integer NOT NULL DEFAULT 1,
        "simulationState" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaigns_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_campaigns_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "campaign_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "public"."campaign_members_role_enum" NOT NULL DEFAULT 'PLAYER',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaign_member_user" UNIQUE ("campaignId", "userId"),
        CONSTRAINT "FK_campaign_members_campaign" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_campaign_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_campaign_member_campaign" ON "campaign_members" ("campaignId")`);
    await queryRunner.query(`CREATE INDEX "IDX_campaign_member_user" ON "campaign_members" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "campaign_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid NOT NULL,
        "type" character varying(80) NOT NULL,
        "day" integer NOT NULL,
        "period" "public"."day_period_enum" NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_campaign_events_campaign" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_event_campaign_created" ON "campaign_events" ("campaignId", "createdAt")`);

    await queryRunner.query(`
      CREATE TABLE "hexes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid NOT NULL,
        "q" integer NOT NULL,
        "r" integer NOT NULL,
        "terrain" "public"."hexes_terrain_enum" NOT NULL,
        "biome" "public"."hexes_biome_enum" NOT NULL,
        "elevation" double precision NOT NULL,
        "moisture" double precision NOT NULL,
        "temperature" double precision NOT NULL,
        "dangerLevel" integer NOT NULL,
        "cosmicInfluence" integer NOT NULL,
        "discoveryStatus" "public"."hexes_discoveryStatus_enum" NOT NULL DEFAULT 'DESCONHECIDO',
        "publicName" character varying(160),
        "masterNotes" text,
        "state" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hexes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaign_hex_coordinate" UNIQUE ("campaignId", "q", "r"),
        CONSTRAINT "FK_hexes_campaign" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_hex_campaign" ON "hexes" ("campaignId")`);

    await queryRunner.query(`
      CREATE TABLE "creature_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid,
        "source" "public"."creature_source_enum" NOT NULL,
        "theme" "public"."creature_theme_enum" NOT NULL DEFAULT 'STANDARD',
        "name" character varying(180) NOT NULL,
        "externalIndex" character varying(180),
        "challengeRating" double precision NOT NULL DEFAULT 0,
        "creatureType" character varying(80) NOT NULL,
        "statBlock" jsonb NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_creature_templates_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_creature_templates_campaign" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_creature_source_name" ON "creature_templates" ("source", "name")`);
    await queryRunner.query(`CREATE INDEX "IDX_creature_campaign" ON "creature_templates" ("campaignId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_creature_external" ON "creature_templates" ("source", "externalIndex") WHERE "externalIndex" IS NOT NULL`);

    await queryRunner.query(`
      CREATE TABLE "random_encounters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId" uuid NOT NULL,
        "hexId" uuid NOT NULL,
        "q" integer NOT NULL,
        "r" integer NOT NULL,
        "day" integer NOT NULL,
        "period" "public"."day_period_enum" NOT NULL,
        "status" "public"."random_encounter_status_enum" NOT NULL DEFAULT 'RASCUNHO',
        "category" "public"."random_encounter_category_enum" NOT NULL,
        "intensity" "public"."random_encounter_intensity_enum" NOT NULL,
        "combatPreference" "public"."random_encounter_combat_enum" NOT NULL,
        "loreRelation" "public"."random_encounter_relation_enum" NOT NULL,
        "title" character varying(180) NOT NULL,
        "publicNarration" text NOT NULL,
        "masterSummary" text NOT NULL,
        "generationSeed" character varying(160) NOT NULL,
        "generatorOptions" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "resolutionNotes" text,
        "createdById" uuid NOT NULL,
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_random_encounters_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_random_encounters_campaign" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_random_encounters_hex" FOREIGN KEY ("hexId") REFERENCES "hexes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_random_encounters_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_encounter_campaign_created" ON "random_encounters" ("campaignId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_encounter_campaign_hex_status" ON "random_encounters" ("campaignId", "q", "r", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "random_encounters"`);
    await queryRunner.query(`DROP TABLE "creature_templates"`);
    await queryRunner.query(`DROP TABLE "hexes"`);
    await queryRunner.query(`DROP TABLE "campaign_events"`);
    await queryRunner.query(`DROP TABLE "campaign_members"`);
    await queryRunner.query(`DROP TABLE "campaigns"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."random_encounter_relation_enum"`);
    await queryRunner.query(`DROP TYPE "public"."random_encounter_combat_enum"`);
    await queryRunner.query(`DROP TYPE "public"."random_encounter_intensity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."random_encounter_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."random_encounter_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."creature_theme_enum"`);
    await queryRunner.query(`DROP TYPE "public"."creature_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."hexes_discoveryStatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."hexes_biome_enum"`);
    await queryRunner.query(`DROP TYPE "public"."hexes_terrain_enum"`);
    await queryRunner.query(`DROP TYPE "public"."campaign_members_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."day_period_enum"`);
  }
}
