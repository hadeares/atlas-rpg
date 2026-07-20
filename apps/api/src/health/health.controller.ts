import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle()
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'atlas-das-cinzas-api',
      timestamp: new Date().toISOString()
    };
  }
}
