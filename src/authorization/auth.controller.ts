import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from '../app.service';
import { CreateUserDto } from '../lib/type/generics-interface';

@Controller()
export class AuthorizationAppController {
  constructor(private readonly appService: AppService) {}

  @Post('createUser')
  async createUser(@Body() userAccessData: CreateUserDto): Promise<string> {
    return await this.appService.setUser(userAccessData);
  }
}
