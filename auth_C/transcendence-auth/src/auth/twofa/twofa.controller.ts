// src/auth/twofa/twofa.controller.ts
import { Body, Controller, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { TwoFAService } from './twofa.service';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';

@Controller('auth/2fa')
export class TwoFAController {
  constructor(
    private readonly twofa: TwoFAService,
    private readonly auth: AuthService,
    private readonly users: UserService,
  ) {}

  // Step 1: generate QR for logged-in user (no 2FA enforcement yet)
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Req() req) {
    const { userId, username } = req.user;
    return this.twofa.generate(userId, username);
  }

  // Step 2: user submits first TOTP; we enable 2FA
  @Post('enable')
  @UseGuards(JwtAuthGuard)
  async enable(@Req() req, @Body('token') token: string) {
    const { userId } = req.user;
    return this.twofa.verifyAndEnable(userId, token);
  }

  // Login step 2: exchange twofa_token + code for access/refresh
  @Post('verify-login')
  async verifyLogin(@Body() body: { twofa_token: string; code: string }) {
    const payload = this.auth.verifyTwoFAToken(body.twofa_token);
    if (!payload?.need2fa || !payload?.sub) throw new UnauthorizedException('Invalid 2FA token');

    const ok = await this.twofa.verifyCode(payload.sub, body.code);
    if (!ok) throw new UnauthorizedException('Invalid 2FA code');

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    return this.auth.generateTokens(user);
  }

  // Optional: disable 2FA (must be logged-in)
  @Post('disable')
  @UseGuards(JwtAuthGuard)
  async disable(@Req() req) {
    const { userId } = req.user;
    return this.twofa.disable(userId);
  }
}
