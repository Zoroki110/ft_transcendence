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
        email: userData.email,
        avatar: userData.image,
        twoFactorEnabled: false,
      };
      this.users.set(user.id, user);
    }

    return user;
  }
}
