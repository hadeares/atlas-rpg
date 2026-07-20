import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { AdvanceTimeDto } from './dto/advance-time.dto';
import { TimeService } from './time.service';

@Controller('campaigns/:campaignId/time')
@UseGuards(JwtAuthGuard)
export class TimeController {
  constructor(private readonly timeService: TimeService) {}

  @Post('advance')
  advance(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() dto: AdvanceTimeDto
  ) {
    return this.timeService.advance(user.userId, campaignId, dto.steps ?? 1);
  }
}
