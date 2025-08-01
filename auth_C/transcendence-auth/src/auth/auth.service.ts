// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateJwt(user: any): string {
    const payload = {
      sub: user.id,
      username: user.username,
    };
    return this.jwtService.sign(payload);
  }
}
