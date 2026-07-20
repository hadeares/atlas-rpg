import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { MovePartyDto } from './dto/move-party.dto';
import { TravelService } from './travel.service';

@Controller('campaigns/:campaignId/travel')
@UseGuards(JwtAuthGuard)
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post('move')
  move(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Body() dto: MovePartyDto) {
    return this.travelService.move(user.userId, campaignId, dto);
  }

  @Post('explore')
  explore(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.travelService.explore(user.userId, campaignId);
  }
}
