// src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { Body, Post } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common'; // also fix this import
import { JwtService } from '@nestjs/jwt';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
	private readonly jwtService: JwtService
  ) {}

  @Get('42')
  @UseGuards(AuthGuard('42'))
  async loginWith42() {
    // Redirection to 42 Intra handled by Passport
  }

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  async callback(@Req() req) {
    const user = await this.userService.findOrCreate(req.user);
    const token = this.authService.generateTokens(user);
    return {
      message: 'Authenticated successfully',
      user,
      access_token: token,
    };
  }

    @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req) {
    return req.user; // JWTStrategy's validate() return object
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    });

    const user = await this.userService.findById(payload.sub);
    const tokens = this.authService.generateTokens(user);
    return tokens;
  } catch (err) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}

}
