import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './cache/redis.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { DatabaseModule } from './database/database.module';
import { CreaturesModule } from './creatures/creatures.module';
import { EncountersModule } from './encounters/encounters.module';
import { HealthModule } from './health/health.module';
import { HexesModule } from './hexes/hexes.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TimeModule } from './time/time.module';
import { TravelModule } from './travel/travel.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env', '../../.env']
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    RedisModule,
    DatabaseModule,
    CreaturesModule,
    AuthModule,
    UsersModule,
    CampaignsModule,
    HexesModule,
    RealtimeModule,
    TimeModule,
    TravelModule,
    EncountersModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
