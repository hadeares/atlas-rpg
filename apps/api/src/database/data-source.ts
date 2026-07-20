import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CampaignEvent } from './entities/campaign-event.entity';
import { CampaignMember } from './entities/campaign-member.entity';
import { Campaign } from './entities/campaign.entity';
import { CreatureTemplate } from './entities/creature-template.entity';
import { Hex } from './entities/hex.entity';
import { RandomEncounter } from './entities/random-encounter.entity';
import { User } from './entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [Campaign, CampaignMember, CampaignEvent, CreatureTemplate, Hex, RandomEncounter, User],
  migrations: [`${__dirname}/migrations/*.{ts,js}`]
});

export default AppDataSource;
