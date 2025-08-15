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
      };
      this.users.set(user.id, user);
    }
    return user;
  }

  async findById(id: string) {
	//return this.userRepository.findOne({ where: { id } }); //for when we have an actual DB
	return this.users.get(id); 
	}

  async setTwoFactorSecret(userId: string, base32: string) {
    const u = this.users.get(userId);
    if (u) { u.twoFactorSecret = base32; this.users.set(userId, u); }
  }

  async enableTwoFactor(userId: string) {
    const u = this.users.get(userId);
    if (u) { u.twoFactorEnabled = true; this.users.set(userId, u); }
  }

  async disableTwoFactor(userId: string) {
    const u = this.users.get(userId);
    if (u) { u.twoFactorEnabled = false; u.twoFactorSecret = null; this.users.set(userId, u); }
  }

}
