// backend_a/src/users/users.controller.ts
import {
  Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Req, Query, UseInterceptors, UploadedFile, BadRequestException, Patch
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendRequestResponseDto } from './dto/friend-request-response.dto';
import { UpdateDisplayNameDto } from './dto/update-display-name.dto';
import { MatchHistoryQueryDto } from './dto/match-history-query.dto';
import { OnlineStatusDto } from './dto/online-status.dto';

import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===============================
  // ENDPOINTS EXISTANTS (gardés)
  // ===============================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  me(@Req() req) {
    return this.usersService.findOne(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @Req() req) {
    if (req.user.sub != id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    if (req.user.sub != id) {
      throw new ForbiddenException('You can only delete your own profile');
    }
    return this.usersService.remove(id);
  }

  // ===============================
  // ENDPOINTS - FRIENDS
  // ===============================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('friends/request')
  @ApiOperation({ summary: 'Send friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully' })
  async sendFriendRequest(@Body() dto: SendFriendRequestDto, @Req() req) {
    return this.usersService.sendFriendRequest(req.user.sub, dto.addresseeId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('friends/requests/:requestId')
  @ApiOperation({ summary: 'Accept or reject friend request' })
  async respondToFriendRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() dto: FriendRequestResponseDto,
    @Req() req
  ) {
    if (dto.accept) {
      return this.usersService.acceptFriendRequest(requestId, req.user.sub);
    } else {
      await this.usersService.rejectFriendRequest(requestId, req.user.sub);
      return { message: 'Friend request rejected' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/friends')
  @ApiOperation({ summary: 'Get my friends list' })
  async getMyFriends(@Req() req) {
    return this.usersService.getFriends(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/friends')
  @ApiOperation({ summary: 'Get user friends list (public)' })
  async getUserFriends(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getFriends(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/friends/requests')
  @ApiOperation({ summary: 'Get pending friend requests' })
  async getPendingRequests(@Req() req) {
    return this.usersService.getPendingFriendRequests(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/friends/online')
  @ApiOperation({ summary: 'Get online friends' })
  async getOnlineFriends(@Req() req) {
    return this.usersService.getOnlineFriends(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('friends/:friendId')
  @ApiOperation({ summary: 'Remove friend' })
  async removeFriend(@Param('friendId', ParseIntPipe) friendId: number, @Req() req) {
    await this.usersService.removeFriend(req.user.sub, friendId);
    return { message: 'Friend removed successfully' };
  }

  // ===============================
  // NOUVEAUX ENDPOINTS - AVATAR
  // ===============================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.usersService.updateAvatar(req.user.sub, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove user avatar' })
  async removeAvatar(@Req() req) {
    return this.usersService.removeAvatar(req.user.sub);
  }

  // ===============================
  // NOUVEAUX ENDPOINTS - DISPLAY NAME
  // ===============================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me/display-name')
  @ApiOperation({ summary: 'Update display name for tournaments' })
  async updateDisplayName(@Body() dto: UpdateDisplayNameDto, @Req() req) {
    return this.usersService.updateDisplayName(req.user.sub, dto.displayName);
  }

  // ===============================
  // NOUVEAUX ENDPOINTS - STATS
  // ===============================

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user game statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/stats')
  @ApiOperation({ summary: 'Get my game statistics' })
  async getMyStats(@Req() req) {
    return this.usersService.getUserStats(req.user.sub);
  }

  // ===============================
  // NOUVEAUX ENDPOINTS - MATCH HISTORY
  // ===============================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/matches')
  @ApiOperation({ summary: 'Get my match history' })
  async getMyMatches(@Query() query: MatchHistoryQueryDto, @Req() req) {
    // Pour l'instant on ignore les query params, on les utilisera plus tard
    return this.usersService.getMatchHistory(req.user.sub);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Get user match history (public)' })
  async getUserMatches(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MatchHistoryQueryDto
  ) {
    return this.usersService.getMatchHistory(id);
  }

  // ===============================
  // NOUVEAUX ENDPOINTS - ONLINE STATUS
  // ===============================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me/status')
  @ApiOperation({ summary: 'Update online status' })
  async updateOnlineStatus(@Body() dto: OnlineStatusDto, @Req() req) {
    await this.usersService.setOnlineStatus(req.user.sub, dto.isOnline);
    return { message: 'Status updated successfully', isOnline: dto.isOnline };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/status/online')
  @ApiOperation({ summary: 'Set status to online' })
  async setOnline(@Req() req) {
    await this.usersService.setOnlineStatus(req.user.sub, true);
    return { message: 'Status set to online' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/status/offline')
  @ApiOperation({ summary: 'Set status to offline' })
  async setOffline(@Req() req) {
    await this.usersService.setOnlineStatus(req.user.sub, false);
    return { message: 'Status set to offline' };
  }

  // ===============================
  // ENDPOINTS UTILITAIRES
  // ===============================

  @Get('search')
  @ApiOperation({ summary: 'Search users by username' })
  async searchUsers(@Query('q') searchQuery: string) {
    if (!searchQuery || searchQuery.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }
    
    // On implémentera cette méthode dans le service plus tard
    // return this.usersService.searchUsers(searchQuery);
    return { message: 'Search feature coming soon', query: searchQuery };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  async getDashboard(@Req() req) {
    const userId = req.user.sub;
    
    // Récupérer toutes les données pour le dashboard
    const [user, stats, friends, pendingRequests, recentMatches] = await Promise.all([
      this.usersService.findOne(userId),
      this.usersService.getUserStats(userId),
      this.usersService.getFriends(userId),
      this.usersService.getPendingFriendRequests(userId),
      this.usersService.getMatchHistory(userId)
    ]);

    return {
      user,
      stats,
      friendsCount: friends.length,
      onlineFriendsCount: friends.filter(f => f.isOnline).length,
      pendingRequestsCount: pendingRequests.length,
      recentMatches: recentMatches.slice(0, 5) // 5 derniers matches
    };
  }
}