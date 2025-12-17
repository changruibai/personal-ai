import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Personal AI API',
      version: '1.0.0',
      status: 'running',
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}



