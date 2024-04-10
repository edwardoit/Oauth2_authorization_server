import { AppService } from '../app.service';
import { AuthorizationAppController } from '../authorization/auth.controller';
import { CreateUserDto } from '../lib/type/generics-interface';
import { response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('AuthorizationAppController', () => {
  let authService: AppService;
  let authorizationAppController: AuthorizationAppController;
  beforeEach(() => {
    authService = new AppService();
    authorizationAppController = new AuthorizationAppController(authService);
  });

  //Http.status created
  describe('root', () => {
    it('should return an array of cats', async () => {
      const clientIds: Array<string> = [];
      //populate array of clients

      const inputDTO: CreateUserDto = {
        name: 'testName',
        surname: 'testSurname',
        age: '2',
        username: 'testName@gmail.com',
        password: 'sdthns234grwr',
      };

      jest
        .spyOn(authService, 'setUser')
        .mockImplementation(() => Promise.resolve(HttpStatus.CREATED));

      // Pass the mock response object to the createUser method
      const controllerResponse = await authorizationAppController.createUser(
        inputDTO,
        response,
      );
      // Assert that the status method is called with the expected status code
      expect(controllerResponse.statusCode).toBe(HttpStatus.CREATED);
    });
  });
});
