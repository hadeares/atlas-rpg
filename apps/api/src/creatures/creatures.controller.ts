import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateCustomCreatureDto } from './dto/create-custom-creature.dto';
import { ListCreaturesQueryDto } from './dto/list-creatures-query.dto';
import { ImportCustomCreaturesDto } from './dto/import-custom-creatures.dto';
import { CreaturesService } from './creatures.service';

@Controller('campaigns/:campaignId/creatures')
@UseGuards(JwtAuthGuard)
export class CreaturesController {
  constructor(private readonly creaturesService: CreaturesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Query() query: ListCreaturesQueryDto) {
    return this.creaturesService.list(user.userId, campaignId, query);
  }

  @Post('custom')
  createCustom(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Body() dto: CreateCustomCreatureDto) {
    return this.creaturesService.createCustom(user.userId, campaignId, dto);
  }

  @Post('custom/import')
  importCustom(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Body() dto: ImportCustomCreaturesDto) {
    return this.creaturesService.importCustom(user.userId, campaignId, dto.creatures);
  }

  @Delete('custom/:creatureId')
  removeCustom(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Param('creatureId') creatureId: string) {
    return this.creaturesService.removeCustom(user.userId, campaignId, creatureId);
  }

  @Post('sync-srd')
  syncSrd(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.creaturesService.requestSrdSync(user.userId, campaignId);
  }

  @Get('sync-status')
  syncStatus(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.creaturesService.getSyncStatus(user.userId, campaignId);
  }
}
