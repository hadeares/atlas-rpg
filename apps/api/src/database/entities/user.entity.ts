import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CampaignMember } from './campaign-member.entity';
import { Campaign } from './campaign.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ length: 120 })
  displayName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Campaign, (campaign) => campaign.owner)
  campaigns: Campaign[];

  @OneToMany(() => CampaignMember, (membership) => membership.user)
  campaignMemberships: CampaignMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
