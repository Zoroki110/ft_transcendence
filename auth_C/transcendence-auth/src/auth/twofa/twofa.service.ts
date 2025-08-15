import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UserService } from '../../user/user.service';

@Injectable()
export class TwoFAService {
  constructor(private readonly users: UserService) {}

  async generate(userId: string, username: string) {
    const secret = speakeasy.generateSecret({
      name: `ft_transcendence (${username})`,
      length: 20,
    });

    await this.users.setTwoFactorSecret(userId, secret.base32);

    const otpauthUrl = secret.otpauth_url;
    if (!otpauthUrl) {
      throw new BadRequestException('Failed to create otpauth URL for 2FA.');
    }

    const qrCode = await qrcode.toDataURL(otpauthUrl);
    return { qrCode, secretBase32: secret.base32, otpauthUrl };
  }

  async verifyAndEnable(userId: string, token: string) {
    const user = await this.users.findById(userId);
    if (!user?.twoFactorSecret) throw new UnauthorizedException('No 2FA setup');

    const ok = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!ok) throw new UnauthorizedException('Invalid 2FA code');

    await this.users.enableTwoFactor(userId);
    return { success: true };
  }

  async verifyCode(userId: string, token: string) {
    const user = await this.users.findById(userId);
    if (!user?.twoFactorSecret) return false;
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async disable(userId: string) {
    await this.users.disableTwoFactor(userId);
    return { success: true };
  }
}
