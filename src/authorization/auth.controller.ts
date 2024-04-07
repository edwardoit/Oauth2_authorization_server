import {
  Body,
  Controller,
  Header,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AppService } from '../app.service';
import {
  CreateUserDto,
  IAuthorization,
  IPreLogin,
  IverifyAccount,
} from '../lib/type/generics-interface';
import { Response } from 'express';

@Controller()
export class AuthorizationAppController {
  constructor(private readonly appService: AppService) {}

  @Post('createUser')
  async createUser(
    @Body() userAccessData: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.appService.setUser(userAccessData);
    response.status(result).json({});
  }

  @Post('auth')
  @Header('Cache-Control', 'private')
  @Header('Pragma', 'No-cache')
  async generateauthorizationcode(
    @Body() userAccessData: IPreLogin,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.appService.auth(userAccessData);
    response.status(result.status).json(result);
  }

  @Post('authorization')
  @Header('Cache-Control', 'private')
  @Header('Pragma', 'No-cache')
  async generatejwt(
    @Body() userAccessData: IAuthorization,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.appService.authorization(userAccessData);
    response.status(result.status).json(result);
  }

  //this should be used from resource server to auth own client's actor
  @Post('verifyjwt')
  @Header('Cache-Control', 'private')
  @Header('Pragma', 'No-cache')
  async verifyJwt(
    @Body() userAccessData: IverifyAccount,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.appService.verifyAccount(userAccessData);
    response
      .status(result.res ? HttpStatus.CREATED : HttpStatus.FORBIDDEN)
      .json(result);
  }
}
