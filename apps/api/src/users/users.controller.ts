import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../common/auth-user.interface';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.usersService.findAll(user.userId);
  }

  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query('q') query = '') {
    return this.usersService.search(user.userId, query);
  }

  @Get(':userId')
  findOne(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.usersService.findOne(user.userId, userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.userId, dto);
  }

  @Patch(':userId')
  update(@CurrentUser() user: AuthUser, @Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.userId, userId, dto);
  }

  @Delete(':userId')
  remove(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.usersService.remove(user.userId, userId);
  }
}
