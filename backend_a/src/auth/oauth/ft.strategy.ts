import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('FT_CLIENT_ID');
    const clientSecret = config.get<string>('FT_CLIENT_SECRET');
    const callbackURL = config.get<string>('FT_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      // Donner un message d’erreur explicite si jamais c’est instancié par erreur
      throw new Error(
        'OAuth 42 mal configuré: FT_CLIENT_ID / FT_CLIENT_SECRET / FT_CALLBACK_URL manquants',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      // scope minimal, ajuste si besoin
      scope: ['public'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    // Map profil 42 -> user OAuth standard
    const user = {
      provider: '42',
      providerId: String(profile?.id),
      username: profile?.username ?? profile?.login,
      email: profile?.emails?.[0]?.value ?? null,
      image: profile?.photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
