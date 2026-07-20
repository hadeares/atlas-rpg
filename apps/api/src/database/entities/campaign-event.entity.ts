import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Campaign } from './campaign.entity';
import { DayPeriod } from './day-period.enum';

@Entity('campaign_events')
@Index('IDX_event_campaign_created', ['campaignId', 'createdAt'])
export class CampaignEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ length: 80 })
  type: string;

  @Column({ type: 'integer' })
  day: number;

  @Column({ type: 'enum', enum: DayPeriod, enumName: 'day_period_enum' })
  period: DayPeriod;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
