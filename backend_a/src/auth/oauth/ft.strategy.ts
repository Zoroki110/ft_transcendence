// src/auth/oauth/ft.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('FT_CLIENT_ID'),
      clientSecret: config.get('FT_CLIENT_SECRET'),
      callbackURL: config.get('FT_CALLBACK_URL'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value || null,
      image: profile._json.image_url,
    };
  }
}
