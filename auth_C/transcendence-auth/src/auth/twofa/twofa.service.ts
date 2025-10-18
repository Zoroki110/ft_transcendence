/* import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
 */

// src/auth/twofa/twofa.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { UserService } from '../../user/user.service';

const PERIOD_SECONDS = 30; // standard TOTP step

function currentStep(): number {
  return Math.floor(Date.now() / 1000 / PERIOD_SECONDS);
}

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

  /**
   * During setup: verify a code from the new secret and enable 2FA.
   * Also initialize lastTwoFaStep to the matched step (so setup code can't be replayed).
   */
  async verifyAndEnable(userId: string, token: string) {
    const user = await this.users.findById(userId);
    if (!user?.twoFactorSecret) throw new UnauthorizedException('No 2FA setup');

    const matchStep = await this.matchingStep(user.twoFactorSecret, token, 1);
    if (matchStep === null) throw new UnauthorizedException('Invalid 2FA code');

    const enabled = await this.users.enableTwoFactorAndSetLastStep(userId, matchStep);
    if (!enabled) throw new UnauthorizedException('Code already used');

    return { success: true };
  }

  /**
   * Login-time verification with single-use semantics.
   * Returns true only once per 30s step (respecting ±window skew).
   */
  async verifyCode(userId: string, token: string) {
    const user = await this.users.findById(userId);
    if (!user?.twoFactorSecret) return false;

    const matchStep = await this.matchingStep(user.twoFactorSecret, token, 1);
    if (matchStep === null) return false;

    const updated = await this.users.setLastTwoFaStepIfGreater(userId, matchStep);
    if (!updated) return false; // same step already consumed (or older)
    return true;
  }

  async disable(userId: string) {
    await this.users.disableTwoFactor(userId);
    return { success: true };
  }

  /**
   * Returns the exact time-step a token matches, or null if invalid.
   * Uses speakeasy.verifyDelta so we can compute the matched step = nowStep + delta.
   */
  private async matchingStep(secretBase32: string, token: string, window: number): Promise<number | null> {
    const now = currentStep();
    const res = speakeasy.totp.verifyDelta({
      secret: secretBase32,
      encoding: 'base32',
      token,
      window,
      step: PERIOD_SECONDS,
    });
    if (!res || typeof res.delta !== 'number') return null;
    return now + res.delta; // the concrete step the code belongs to
  }
}
