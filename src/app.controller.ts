import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  //maintain example hello from main path - possible health check implementation
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
