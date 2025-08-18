import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: { email?: string; password?: string }) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('email and password are required');
    }
    return this.authService.loginWithEmail(body.email, body.password);
  }

  @Get('42')
  @UseGuards(AuthGuard('42'))
  async loginWith42() {}

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  async callback(@Req() req) {
    const user = await this.usersService.findOrCreate(req.user);
    const token = this.authService.generateJwt(user);
    return { message: 'Authenticated successfully', user, access_token: token };
  }
}