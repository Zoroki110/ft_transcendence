import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/')
  root() {
    return { ok: true, service: 'backend_a', ts: new Date().toISOString() };
  }
}