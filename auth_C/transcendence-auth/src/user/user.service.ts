// src/user/user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users = new Map(); // Simulated DB

  async findOrCreate(userData: any) {
    let user = this.users.get(userData.id);

    if (!user) {
      user = {
        id: userData.id,
        username: userData.username,
        email: userData.email ?? null,
        avatar: userData.image ?? null,
        twoFactorEnabled: false,
		twoFactorSecret: null, //base 32
		lastTwoFaStep: null,
      };
      this.users.set(user.id, user);
    }
    return user;
  }

  async findById(id: string) {
	//return this.userRepository.findOne({ where: { id } }); //for when we have an actual DB
	return this.users.get(id);
	}

  async setTwoFactorSecret(userId: string, base32: string): Promise<void> {
    const u = this.users.get(userId);
    if (u) {
      u.twoFactorSecret = base32;
      // reset lastTwoFaStep on (re)setup to avoid weird edge cases
      u.lastTwoFaStep = null;
      this.users.set(userId, u);
    }
  }
  async enableTwoFactor(userId: string) {
    const u = this.users.get(userId);
    if (u) {
		u.twoFactorEnabled = true;
		this.users.set(userId, u);
	}
  }

  async disableTwoFactor(userId: string) {
    const u = this.users.get(userId);
    if (u){
		u.twoFactorEnabled = false;
		u.twoFactorSecret = null;
		this.users.set(userId, u);
	}
  }
    /**
   * Used during setup (verifyAndEnable): enable 2FA and initialize lastTwoFaStep to the matched step.
   * Returns false if a same/older step was already recorded (defensive; with in-memory it should be fine).
   */
  async enableTwoFactorAndSetLastStep(userId: string, step: number): Promise<boolean> {
    const u = this.users.get(userId);
    if (!u) return false;

    const prev = u.lastTwoFaStep;
    if (prev == null || step > prev) {
      u.twoFactorEnabled = true;
      u.lastTwoFaStep = step;
      this.users.set(userId, u);
      return true;
    }
    return false;
  }

  /**
   * Single-use guard: accept only if 'step' is newer than lastTwoFaStep.
   * Returns true and updates lastTwoFaStep; otherwise false.
   */
  async setLastTwoFaStepIfGreater(userId: string, step: number): Promise<boolean> {
    const u = this.users.get(userId);
    if (!u) return false;

    const prev = u.lastTwoFaStep;
    if (prev == null || step > prev) {
      u.lastTwoFaStep = step;
      this.users.set(userId, u);
      return true;
    }
    return false;
  }
}
