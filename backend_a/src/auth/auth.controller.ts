import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ApiThrottle } from '../common/decorators/api-throttle.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiThrottle({ limit: 5, ttl: 900000 }) //5 tentatives -> 15 min
  async login(@Body() body: { email?: string; password?: string }) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('email and password are required');
    }
    return this.authService.loginWithEmail(body.email, body.password);
  }

  @Get('42')
  @UseGuards(AuthGuard('42'))
  @ApiThrottle({ limit: 10, ttl: 60000 })
  async loginWith42() {}

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  @ApiThrottle({ limit: 10, ttl: 60000 })
  async callback(@Req() req) {
    const user = await this.usersService.findOrCreate(req.user);
    const token = this.authService.generateJwt(user);
    return { message: 'Authenticated successfully', user, access_token: token };
  }

  @Post('register')
  async register(@Body() body: { username: string; email: string; password: string }) {
    if (!body?.username || !body?.email || !body?.password) {
      throw new BadRequestException('username, email and password are required');
    }
    
    // Créer l'utilisateur via UsersService
    const user = await this.usersService.create({
      username: body.username,
      email: body.email,
      password: body.password
    });
    
    // Générer le token JWT
    const access_token = this.authService.generateJwt(user);
    
    return { 
      message: 'User registered successfully', 
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      access_token 
    };
  }
}