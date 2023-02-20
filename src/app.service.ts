import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as process from 'process';
import {
  CreateUserDto,
  IOUserData,
  IOuserType,
  IPreLogin,
} from './lib/type/generics-interface';
import { UserRepository } from './lib/user-repository';
import { uuid } from 'uuidv4';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  async setUser(userAccessData: CreateUserDto): Promise<string> {
    const doc: IOuserType = {
      _id: uuid(),
      ...userAccessData,
    };
    if (userAccessData.password == undefined) return 'insert valid password';
    const hashing = JSON.parse(await passwordHasing(userAccessData.password));
    doc.salt = hashing.salt;
    doc.password = hashing.hashedPassword;
    if (userAccessData.password == '') {
      return 'password not saved!';
    } else {
      const userConnection = new UserRepository(doc);
      await userConnection.instaceDB();
      console.log(userAccessData.password);
      await userConnection.insertNewUser(doc);
      return 'you have create a new user!';
    }
  }
}

async function HelloServer(userAccessData: IPreLogin): Promise<string> {
  const code = process.env.AUTHORIZATION_CODE;
  return '';
}

async function passwordHasing(myValue: string): Promise<string> {
  const hashedPassword = await new Promise((resolve) => {
    bcrypt.genSalt(10, function (err: any, salt: any) {
      console.log(salt);
      bcrypt.hash(myValue, salt, function (err: any, hash: any) {
        console.log(myValue);
        console.log(hash);
        resolve({
          hashedPassword: String(hash),
          salt: String(salt),
        });
      });
    });
  });
  return JSON.stringify(hashedPassword);
}
