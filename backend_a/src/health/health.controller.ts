import { Controller, Get } from '@nestjs/common';

@Controller('health')  // ← Ajouter le préfixe 'health'
export class HealthController {
  @Get()  // ← Maintenant cela fera /health
  check() {
    return { 
      status: 'ok', 
      service: 'backend_a', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }
}