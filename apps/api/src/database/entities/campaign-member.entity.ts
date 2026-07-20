import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from './user.entity';

export enum CampaignMemberRole {
  MASTER = 'MASTER',
  PLAYER = 'PLAYER'
}

@Entity('campaign_members')
@Unique('UQ_campaign_member_user', ['campaignId', 'userId'])
@Index('IDX_campaign_member_campaign', ['campaignId'])
@Index('IDX_campaign_member_user', ['userId'])
export class CampaignMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.campaignMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: CampaignMemberRole, default: CampaignMemberRole.PLAYER })
  role: CampaignMemberRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
