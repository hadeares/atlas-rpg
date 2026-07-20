import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CampaignEvent } from './campaign-event.entity';
import { CampaignMember } from './campaign-member.entity';
import { DayPeriod } from './day-period.enum';
import { Hex } from './hex.entity';
import { User } from './user.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 120 })
  seed: string;

  @Column({ type: 'varchar', length: 12, unique: true, nullable: true })
  inviteCode: string | null;

  @Column({ type: 'integer', default: 6 })
  radius: number;

  @Column({ type: 'integer', default: 1 })
  currentDay: number;

  @Column({ type: 'enum', enum: DayPeriod, enumName: 'day_period_enum', default: DayPeriod.MANHA })
  currentPeriod: DayPeriod;

  @Column({ type: 'integer', default: 0 })
  currentQ: number;

  @Column({ type: 'integer', default: 0 })
  currentR: number;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  simulationState: Record<string, unknown>;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.campaigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => CampaignMember, (member) => member.campaign)
  members: CampaignMember[];

  @OneToMany(() => Hex, (hex) => hex.campaign)
  hexes: Hex[];

  @OneToMany(() => CampaignEvent, (event) => event.campaign)
  events: CampaignEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
