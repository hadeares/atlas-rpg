import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { AddCampaignMemberDto } from './dto/add-campaign-member.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { JoinCampaignDto } from './dto/join-campaign.dto';
import { UpdateCampaignMemberDto } from './dto/update-campaign-member.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.campaignsService.findAll(user.userId);
  }

  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinCampaignDto) {
    return this.campaignsService.joinByCode(user.userId, dto.inviteCode);
  }

  @Get(':campaignId')
  findOne(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.findOne(user.userId, campaignId);
  }

  @Get(':campaignId/live-state')
  getLiveState(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.getLiveState(user.userId, campaignId);
  }

  @Get(':campaignId/events')
  listEvents(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Query('limit') limit?: string) {
    return this.campaignsService.listEvents(user.userId, campaignId, limit ? Number(limit) : undefined);
  }

  @Patch(':campaignId')
  update(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(user.userId, campaignId, dto);
  }

  @Delete(':campaignId')
  remove(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.remove(user.userId, campaignId);
  }

  @Post(':campaignId/invite-code/regenerate')
  regenerateInviteCode(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.regenerateInviteCode(user.userId, campaignId);
  }

  @Get(':campaignId/members')
  listMembers(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.listMembers(user.userId, campaignId);
  }

  @Post(':campaignId/members')
  addMember(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Body() dto: AddCampaignMemberDto) {
    return this.campaignsService.addMember(user.userId, campaignId, dto);
  }

  @Patch(':campaignId/members/:memberId')
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateCampaignMemberDto
  ) {
    return this.campaignsService.updateMember(user.userId, campaignId, memberId, dto);
  }

  @Delete(':campaignId/members/:memberId')
  removeMember(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Param('memberId') memberId: string) {
    return this.campaignsService.removeMember(user.userId, campaignId, memberId);
  }
}
