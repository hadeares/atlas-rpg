import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { DatabaseModule } from './database/database.module';
import { CreaturesModule } from './creatures/creatures.module';
import { EncountersModule } from './encounters/encounters.module';
import { HealthModule } from './health/health.module';
import { HexesModule } from './hexes/hexes.module';
import { TimeModule } from './time/time.module';
import { TravelModule } from './travel/travel.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env', '../../.env']
    }),
    DatabaseModule,
    CreaturesModule,
    AuthModule,
    UsersModule,
    CampaignsModule,
    HexesModule,
    TimeModule,
    TravelModule,
    EncountersModule,
    HealthModule
  ]
})
export class AppModule {}
