import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ApiThrottle } from '../common/decorators/api-throttle.decorator';
import { Response, Request } from 'express';
import { cookieName, cookieOpts } from './cookie.util';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiThrottle({ limit: 5, ttl: 900000 }) //5 tentatives -> 15 min
  async login(
    @Body() body: { email?: string; password?: string },
    @Res() res: Response,
    ) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('email and password are required');
    }
    const { user, access_token } = await this.authService.loginWithEmail(
        body.email,
        body.password,
    );

    res.cookie(cookieName, access_token, cookieOpts);

    return res.status(200).send({
        message: 'Logged in',
        user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesLost,
        tournamentsWon: user.tournamentsWon,
        totalScore: user.totalScore,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        },
    });
}

  @Get('42')
  @UseGuards(AuthGuard('42'))
  @ApiThrottle({ limit: 10, ttl: 60000 })
  async loginWith42() {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))       // uses the 'jwt' strategy above
  me(@Req() req) {
  return req.user;                 // whatever JwtStrategy.validate returns
  }

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  @ApiThrottle({ limit: 10, ttl: 60000 })
  async callback(@Req() req, @Res() res: Response) {
    // Create or find user
    const user = await this.usersService.findOrCreate(req.user);

    // Your existing single-token generator
    const accessToken = this.authService.generateJwt(user);

    // Cookie options for local dev; flip in prod (https)
    const secure = false;                 // true in prod (https)
    const sameSite: any = 'lax';          // 'none' in prod (with secure=true)
    const domain = 'localhost';           // align with your local setup

    // Set httpOnly cookie
    res.cookie(cookieName, accessToken, cookieOpts);

    // Redirect back to the frontend landing page
    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const returnTo = (req.query?.return_to as string) || `${frontendBase}/auth/complete`;

    return res.redirect(302, returnTo);
  }

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string },
    @Res() res: Response,
  ) {
    if (!body?.username || !body?.email || !body?.password) {
      throw new BadRequestException(
        'username, email and password are required',
      );
    }

    // Créer l'utilisateur via UsersService
    const user = await this.usersService.create({
      username: body.username,
      email: body.email,
      password: body.password,
    });

    // Générer le token JWT
    const access_token = this.authService.generateJwt(user);
    res.cookie(cookieName, access_token, cookieOpts);

    return res.status(201).send({
        message: 'User registered successfully',
        user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        gamesWon: user.gamesWon,
        gamesLost: user.gamesLost,
        tournamentsWon: user.tournamentsWon,
        totalScore: user.totalScore,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        },
        // optional: drop access_token from the body; cookie is the source of truth
    });
}

    @Post('logout')
    async logout(@Res() res: Response) {
    // Clear using the SAME options you used to set it:
    res.clearCookie(cookieName, { ...cookieOpts, maxAge: undefined });
    // Defense-in-depth: overwrite with immediate expiry
    res.cookie(cookieName, '', { ...cookieOpts, maxAge: 0 });
    return res.status(204).send();
    }

}
