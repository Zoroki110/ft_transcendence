/*import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: any): Promise<string> {
    // On identifie chaque utilisateur par IP + son ID (si connecté)
    const user = req.user;
    const userId = user?.id || 'anonymous';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    
    return `${ip}-${userId}`;
  }
}*/