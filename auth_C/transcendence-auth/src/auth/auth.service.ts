// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/* @Injectable()
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
 */

// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateTokens(user: any) {
    const payload = { sub: user.id, username: user.username };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
    });

    return { access_token, refresh_token };
  }

  generateTwoFAToken(user: any) {
    const payload = { sub: user.id, username: user.username, need2fa: true };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_2FA_TOKEN_SECRET,
      expiresIn: process.env.JWT_2FA_TOKEN_EXPIRATION || '5m',
    });
  }

  verifyTwoFAToken(twofaToken: string) {
    return this.jwtService.verify(twofaToken, { secret: process.env.JWT_2FA_TOKEN_SECRET });
  }

  // Optional: you could also verify/refresh a token here
}
