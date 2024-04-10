import { Body, Controller, Header, HttpStatus, Post, Response } from "@nestjs/common";
import { AppService } from "../app.service";
import { CreateUserDto, IAuthorization, IPreLogin, IverifyAccount } from "../lib/type/generics-interface";
import { Response as Res } from "express";

@Controller()
export class AuthorizationAppController {
  constructor(private readonly appService: AppService) {}

  @Post('createUser')
  @Header('Cache-Control', 'private')
  async createUser(
    @Body() userAccessData: CreateUserDto,
    @Response() res: Res,
  ): Promise<Res> {
    const result = await this.appService.setUser(userAccessData);
    return res.status(result);
  }

  @Post('auth')
  @Header('Cache-Control', 'private')
  @Header('Pragma', 'No-cache')
  async generateAuthorizationCode(
    @Body() userAccessData: IPreLogin,
    @Response() res: Res,
  ): Promise<Res> {
    const result = await this.appService.auth(userAccessData);
    console.log(result);
    return res.status(result.status).json(result);
  }

  @Post('authorization')
  @Header('Cache-Control', 'private')
  @Header('Pragma', 'No-cache')
  async generateJwt(
    @Body() userAccessData: IAuthorization,
    @Response() res: Res,
  ): Promise<Res> {
    const result = await this.appService.authorization(userAccessData);
    return res.status(result.status).json(result);
  }

  //this should be used from resource server to auth own client's actor
  @Post('verifyjwt')
  @Header('Cache-Control', 'private')
  @Header('Pragma', 'No-cache')
  async verifyJwt(
    @Body() userAccessData: IverifyAccount,
    @Response() res: Res,
  ): Promise<Res> {
    const result = await this.appService.verifyAccount(userAccessData);
    return res
      .status(result.res ? HttpStatus.CREATED : HttpStatus.FORBIDDEN)
      .json(result);
  }
}
