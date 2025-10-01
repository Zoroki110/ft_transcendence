import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
/*import { CustomThrottleGuard } from '../guards/custom-throttle.guard';*/

interface ThrottleConfig {
  limit: number; // Nombre max de requêtes
  ttl: number; // Durée en millisecondes
}

export function ApiThrottle(config: ThrottleConfig) {
  return applyDecorators(
    Throttle({
      default: {
        limit: config.limit,
        ttl: config.ttl,
      },
    }),
    /* UseGuards(CustomThrottleGuard),*/
  );
}
