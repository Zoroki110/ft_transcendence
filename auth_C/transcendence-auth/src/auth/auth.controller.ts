// src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
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
    const token = this.authService.generateJwt(user);
    return {
      message: 'Authenticated successfully',
      user,
      access_token: token,
    };
  }
}
