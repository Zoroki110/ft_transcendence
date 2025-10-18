import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

function cookieExtractor(req: Request): string | null {
  // Read the token set by /auth/42/callback
  return req?.cookies?.access_token ?? null;
}

/* @Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_ACCESS_SECRET') ??
        config.get<string>('JWT_SECRET') ??
        'change-me',
    });
  }
  async validate(payload: any) {
    return payload; // => req.user.sub disponible
  }
}
 */

function accessTokenFromHeader(req: Request): string | null {
  const raw = req?.headers?.cookie;
  if (!raw) return null;
  // turn "a=b; c=d" into { a: "b", c: "d" }
  const map = Object.fromEntries(
    raw.split(';').map(kv => {
      const i = kv.indexOf('=');
      const k = kv.slice(0, i).trim();
      const v = decodeURIComponent(kv.slice(i + 1));
      return [k, v];
    })
  );
  return map['access_token'] ?? null;
}


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        accessTokenFromHeader,                                // 👈 add this
        ExtractJwt.fromAuthHeaderAsBearerToken(),       // keep as fallback
      ]),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_ACCESS_SECRET') ??
        config.get<string>('JWT_SECRET') ??
        'change-me',
    });
  }

  async validate(payload: any) {
    // Keep as-is
    return payload; // => req.user available
  }
}