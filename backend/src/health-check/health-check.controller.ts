import { Controller, Get } from '@nestjs/common';

@Controller('backend')
export class HealthCheckController {
  @Get('health-check')
  healthCheck() {
    return { status: 'health check Ok' };
  }
}
