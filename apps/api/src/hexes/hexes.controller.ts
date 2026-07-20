import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateHexLoreDto } from './dto/update-hex-lore.dto';
import { UpdateHexDto } from './dto/update-hex.dto';
import { HexesService } from './hexes.service';

@Controller('campaigns/:campaignId/hexes')
@UseGuards(JwtAuthGuard)
export class HexesController {
  constructor(private readonly hexesService: HexesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.hexesService.findAll(user.userId, campaignId);
  }

  @Get(':q/:r')
  findOne(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Param('q') q: string, @Param('r') r: string) {
    return this.hexesService.findOne(user.userId, campaignId, Number(q), Number(r));
  }

  @Patch(':q/:r')
  update(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Param('q') q: string, @Param('r') r: string, @Body() dto: UpdateHexDto) {
    return this.hexesService.update(user.userId, campaignId, Number(q), Number(r), dto);
  }

  @Patch(':q/:r/lore')
  updateLore(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Param('q') q: string, @Param('r') r: string, @Body() dto: UpdateHexLoreDto) {
    return this.hexesService.updateLore(user.userId, campaignId, Number(q), Number(r), dto);
  }

  @Post(':q/:r/lore/regenerate')
  regenerateLore(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Param('q') q: string, @Param('r') r: string) {
    return this.hexesService.regenerateLore(user.userId, campaignId, Number(q), Number(r));
  }
}
