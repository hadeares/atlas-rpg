import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Campaign } from './campaign.entity';

export enum TerrainType {
  PLANICIE = 'PLANICIE',
  FLORESTA = 'FLORESTA',
  FLORESTA_DENSA = 'FLORESTA_DENSA',
  COLINA = 'COLINA',
  MONTANHA = 'MONTANHA',
  PANTANO = 'PANTANO',
  REGIAO_ALAGADA = 'REGIAO_ALAGADA',
  RUINAS = 'RUINAS',
  CAMPO_DEVASTADO = 'CAMPO_DEVASTADO',
  REGIAO_CONTAMINADA = 'REGIAO_CONTAMINADA'
}

export enum BiomeType {
  CAMPOS_CINZENTOS = 'CAMPOS_CINZENTOS',
  BOSQUE_MORTO = 'BOSQUE_MORTO',
  MATA_PALIDA = 'MATA_PALIDA',
  TERRAS_ALTAS = 'TERRAS_ALTAS',
  PICOS_NEGROS = 'PICOS_NEGROS',
  BREJO_SILENCIOSO = 'BREJO_SILENCIOSO',
  AGUAS_MORTAS = 'AGUAS_MORTAS',
  CICATRIZ_ANTIGA = 'CICATRIZ_ANTIGA',
  ERMO_DE_CINZAS = 'ERMO_DE_CINZAS',
  ZONA_DA_FERIDA = 'ZONA_DA_FERIDA'
}

export enum DiscoveryStatus {
  DESCONHECIDO = 'DESCONHECIDO',
  AVISTADO = 'AVISTADO',
  ATRAVESSADO = 'ATRAVESSADO',
  EXPLORADO = 'EXPLORADO',
  MAPEADO = 'MAPEADO'
}

@Entity('hexes')
@Unique('UQ_campaign_hex_coordinate', ['campaignId', 'q', 'r'])
@Index('IDX_hex_campaign', ['campaignId'])
export class Hex {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.hexes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ type: 'integer' })
  q: number;

  @Column({ type: 'integer' })
  r: number;

  @Column({ type: 'enum', enum: TerrainType })
  terrain: TerrainType;

  @Column({ type: 'enum', enum: BiomeType })
  biome: BiomeType;

  @Column({ type: 'double precision' })
  elevation: number;

  @Column({ type: 'double precision' })
  moisture: number;

  @Column({ type: 'double precision' })
  temperature: number;

  @Column({ type: 'integer' })
  dangerLevel: number;

  @Column({ type: 'integer' })
  cosmicInfluence: number;

  @Column({ type: 'enum', enum: DiscoveryStatus, default: DiscoveryStatus.DESCONHECIDO })
  discoveryStatus: DiscoveryStatus;

  @Column({ type: 'varchar', length: 160, nullable: true })
  publicName: string | null;

  @Column({ type: 'text', nullable: true })
  masterNotes: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  state: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
