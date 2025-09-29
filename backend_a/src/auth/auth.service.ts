import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUserByEmail(email: string, password: string) {
    const user = await this.usersService.findOneRawByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  generateJwt(user: any): string {
    const payload = { sub: user.id, username: user.username, email: user.email };
    return this.jwtService.sign(payload);
  }

  async loginWithEmail(email: string, password: string) {
    const user = await this.validateUserByEmail(email, password);
    const access_token = this.generateJwt(user);
    return { 
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
        updatedAt: user.updatedAt
      },
      access_token 
    };
  }
}
