import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { RespondChallengeDto } from './dto/respond-challenge.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('challenges')
@Controller('challenges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a challenge to another user' })
  @ApiResponse({ status: 201, description: 'Challenge sent successfully' })
  async createChallenge(@Body() dto: CreateChallengeDto, @Req() req) {
    return this.challengesService.createChallenge(req.user.sub, dto);
  }

  @Get('received')
  @ApiOperation({ summary: 'Get pending challenges received' })
  async getPendingChallenges(@Req() req) {
    return this.challengesService.getPendingChallenges(req.user.sub);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get pending challenges sent' })
  async getSentChallenges(@Req() req) {
    return this.challengesService.getSentChallenges(req.user.sub);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get challenge history' })
  async getChallengeHistory(@Req() req) {
    return this.challengesService.getChallengeHistory(req.user.sub);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or decline a challenge' })
  async respondToChallenge(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondChallengeDto,
    @Req() req,
  ) {
    if (dto.accept) {
      return this.challengesService.acceptChallenge(id, req.user.sub);
    } else {
      await this.challengesService.declineChallenge(id, req.user.sub);
      return { message: 'Challenge declined' };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a challenge you sent' })
  async cancelChallenge(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.challengesService.cancelChallenge(id, req.user.sub);
    return { message: 'Challenge cancelled' };
  }
}
