import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthorizationAppController } from './authorization/auth.controller';

@Module({
  imports: [],
  controllers: [AppController, AuthorizationAppController],
  providers: [AppService],
})
export class AppModule {}
