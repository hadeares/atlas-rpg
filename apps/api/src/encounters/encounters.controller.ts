import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { GenerateEncounterDto } from './dto/generate-encounter.dto';
import { ListEncountersQueryDto } from './dto/list-encounters-query.dto';
import { UpdateCombatDto } from './dto/update-combat.dto';
import { UpdateEncounterStatusDto } from './dto/update-encounter-status.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { EncountersService } from './encounters.service';

@Controller('campaigns/:campaignId/encounters')
@UseGuards(JwtAuthGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post('generate')
  generate(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() dto: GenerateEncounterDto
  ) {
    return this.encountersService.generate(user.userId, campaignId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Query() query: ListEncountersQueryDto
  ) {
    return this.encountersService.findAll(user.userId, campaignId, query);
  }

  @Get(':encounterId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('encounterId') encounterId: string
  ) {
    return this.encountersService.findOne(user.userId, campaignId, encounterId);
  }

  @Patch(':encounterId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('encounterId') encounterId: string,
    @Body() dto: UpdateEncounterDto
  ) {
    return this.encountersService.update(user.userId, campaignId, encounterId, dto);
  }

  @Patch(':encounterId/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('encounterId') encounterId: string,
    @Body() dto: UpdateEncounterStatusDto
  ) {
    return this.encountersService.updateStatus(user.userId, campaignId, encounterId, dto);
  }

  @Patch(':encounterId/combat')
  updateCombat(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('encounterId') encounterId: string,
    @Body() dto: UpdateCombatDto
  ) {
    return this.encountersService.updateCombat(user.userId, campaignId, encounterId, dto);
  }

  @Delete(':encounterId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('encounterId') encounterId: string
  ) {
    return this.encountersService.remove(user.userId, campaignId, encounterId);
  }
}
