import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  IAuthorization,
  IPostLogin,
  IPreLogin,
  ITokenGenerate,
  Iuser,
  IverifyAccount,
  IverifyResult,
} from './lib/type/generics-interface';
import { uuid } from 'uuidv4';
import * as dotenv from 'dotenv';
import {
  connectionAuthCollection,
  connectionTokenCollection,
  connectionUserCollection,
} from './lib/connectionDB';
import * as jose from 'jose';
import * as crypto from 'node:crypto';
import * as process from 'node:process';

dotenv.config();

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Auth Server!';
  }

  async setUser(userAccessData: CreateUserDto): Promise<HttpStatus> {
    if (userAccessData.password == undefined) return HttpStatus.BAD_REQUEST;
    const hashing = JSON.parse(await passwordHashing(userAccessData.password));
    const firstClient: Array<string> = [];
    firstClient.push(uuid()); //identify device end create clientID
    console.log(hashing);
    const doc: Iuser = {
      _id: uuid(),
      name: userAccessData.name,
      surname: userAccessData.surname,
      age: userAccessData.age,
      username: userAccessData.username,
      password: hashing.hashedPassword,
      salt: hashing.salt,
      clientIDs: firstClient,
    };
    if (userAccessData.password == '' || doc.salt == undefined) {
      return HttpStatus.BAD_REQUEST;
    } else {
      const repo = await connectionUserCollection;
      console.log(doc.password);
      if (await repo.retriveOneuser(doc.username))
        return HttpStatus.BAD_REQUEST;
      await repo.insertNewUser(doc);
      return HttpStatus.CREATED;
    }
  }

  //auth user init
  async auth(userAccessData: IPreLogin): Promise<IPostLogin> {
    const repo = await connectionUserCollection;
    const user = await repo.retriveOneuser(userAccessData.username);

    // start email confirm for register new clientID
    //TODO create new clientID with information device and push on MongoDb's clientID array
    const tmpAuthCode = crypto.randomBytes(64).toString('hex');

    if (user) {
      //check compliance of clientID
      let clientIDCompliance = false;
      user.clientIDs.map((item) => {
        if (userAccessData.clientID == item) clientIDCompliance = true;
      });
      if (!clientIDCompliance)
        return {
          message: 'Client id not found',
          status: HttpStatus.BAD_REQUEST,
        };
      //use recorded salt associated with username to perform hashed pwd comparation
      const currentPassword = JSON.parse(
        await authorizationHashing(userAccessData.password, user.salt),
      );
      //check password integrity
      if (currentPassword.passwordComparator != user.password)
        return {
          message: 'Pwd incorrect',
          status: HttpStatus.BAD_REQUEST,
        };
      const repo = await connectionAuthCollection;
      const alreadyPresent = await repo.retrivebyID(userAccessData.clientID);
      if (alreadyPresent) {
        await repo.updateAuthCode({
          auth_code: tmpAuthCode,
          clientID: userAccessData.clientID,
          used: false,
        });
      } else {
        await repo.insertNewAuthCode({
          _id: uuid(),
          auth_code: tmpAuthCode,
          clientID: userAccessData.clientID,
          used: false,
        });
      }
      //successfully operation

      return {
        authorization_code: tmpAuthCode,
        status: HttpStatus.CREATED,
      };
    }
    return {
      message: 'Register your account',
      status: HttpStatus.BAD_REQUEST,
    };
  }

  async authorization(userAccessData: IAuthorization): Promise<ITokenGenerate> {
    console.log(userAccessData);
    const token = await generateAccessToken(userAccessData.clientID);
    const refresh_token = await generateRefreshToken(userAccessData.clientID);
    console.log(token);
    const auth_repo = await connectionAuthCollection;
    const repo = await connectionTokenCollection;
    const auth_code_validity = await auth_repo.retriveByAuthCode(
      userAccessData.authorization_code,
    );
    //attack prevention
    if (auth_code_validity?.used) {
      //send mail with topic for cross attack
      await repo.deleteAllAccessToken(userAccessData.clientID);
      return {
        jwt: '',
        refreshToken: '',
        status: HttpStatus.UNAUTHORIZED,
      };
    } else {
      await auth_repo.updateAuthCode({
        auth_code: userAccessData.authorization_code,
        clientID: userAccessData.clientID,
        used: true,
      });

      const alreadyPresent = await repo.retrivebyID(userAccessData.clientID); //search by _id ref to client
      if (alreadyPresent) {
        await repo.updateJwt({
          jwt: token,
          clientID: userAccessData.clientID,
        });
      } else {
        await repo.insertNewJwt({
          _id: uuid(),
          jwt: token,
          clientID: userAccessData.clientID,
          refreshToken: refresh_token,
        });
      }
    }

    return {
      jwt: token,
      refreshToken: refresh_token,
      status: HttpStatus.CREATED,
    };
  }

  async verifyAccount(userAccessData: IverifyAccount): Promise<IverifyResult> {
    const repo = await connectionTokenCollection;
    const referenceOnDb = await repo.retriveByJwt(userAccessData.jwt);
    if (!referenceOnDb)
      throw new Error('jwt not found, someone try to force infrastructure');
    return await verifyJwt(
      referenceOnDb?.clientID,
      userAccessData.jwt,
      referenceOnDb.refreshToken,
    );
    //return boolean or boolean && jwt updated
  }
}

async function passwordHashing(myValue: string): Promise<string> {
  const hashedPassword = await new Promise((resolve) => {
    bcrypt.genSalt(10, function (err: any, salt: any) {
      bcrypt.hash(myValue, salt, function (err: any, hash: any) {
        resolve({
          hashedPassword: String(hash),
          salt: String(salt),
        });
      });
    });
  });
  return JSON.stringify(hashedPassword);
}

async function authorizationHashing(
  password: string,
  salt: string,
): Promise<string> {
  const res = await new Promise((resolve) => {
    bcrypt.hash(password, salt, function (err: any, hash: any) {
      console.log(hash);
      resolve({
        passwordComparator: String(hash),
      });
    });
  });
  return JSON.stringify(res);
}

//real auth server should be used privateKey (asymmetric) but for testing purpose can be used symmetric algorithm
//NB -> sign with privateKey
async function generateAccessToken(username: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.PRIVATE_KEY);
  const alg = 'HS256';

  const date = new Date();

  const jwt = await new jose.SignJWT({
    'urn:authorization:claim': true,
    sub: username,
    scope: 'private_section',
  })
    .setProtectedHeader({ alg })
    .setIssuedAt(date.getTime())
    .setIssuer('urn:authorization:dredo:auth:server')
    .setExpirationTime(date.getTime() + 86400000) // delta is one day
    .sign(secret);

  return jwt;
}

async function generateRefreshToken(username: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.PRIVATE_KEY);
  const alg = 'HS256';

  const date = new Date();

  const jwt = await new jose.SignJWT({
    'urn:authorization:claim': true,
    sub: username, //must be a private key for compliance
    scope: 'private_section',
  })
    .setProtectedHeader({ alg })
    .setIssuedAt(date.getTime())
    .setIssuer('urn:authorization:dredo:auth:server')
    .setExpirationTime(date.getTime() + 86400000) // delta is 1 day
    .sign(secret);

  return jwt;
}

async function verifyJwt(
  id: string,
  token: string,
  refreshToken: string,
): Promise<IverifyResult> {
  const repo = await connectionTokenCollection;

  const secret = new TextEncoder().encode(process.env.PRIVATE_KEY);

  const { payload, protectedHeader } = await jose.jwtVerify(token, secret);
  const expirationRefreshToken = await verifyRefreshToken(secret, refreshToken);

  //control compliance username(private key), otherwise return false
  const now = new Date().getTime();
  if (!payload.exp || !payload.sub) return { res: false };
  if (payload.sub == id && payload.exp > now) return { res: true };
  //if complince ->true must verify the exipiration date id exipired update jwt
  //return true or true and jwt
  if (
    payload.sub == id &&
    payload.exp < now &&
    Number(expirationRefreshToken) > now
  ) {
    //refreshToken.expireDate < now
    const jwt = await generateAccessToken(id);

    const alreadyPresent = await repo.retrivebyID(id);
    if (alreadyPresent) {
      await repo.updateJwt({
        jwt: jwt,
        clientID: id,
      });
    }
    return {
      res: true,
      jwt: jwt,
    };
  }
  repo.deleteJwt(token, id);
  return {
    res: false,
  };
}

async function verifyRefreshToken(
  secret: Uint8Array,
  token: string,
): Promise<string> {
  const { payload, protectedHeader } = await jose.jwtVerify(token, secret);
  if (payload.exp) return String(payload.exp);
  return '';
}
