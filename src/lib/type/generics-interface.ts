import { array, boolean, InferType, object, string } from 'yup';
import { HttpStatus } from '@nestjs/common';

export interface CreateUserDto {
  name: string;
  surname: string;
  age: string;
  username: string;
  password: string;
}

export interface Iuser {
  _id: string;
  name: string;
  surname: string;
  age: string;
  username: string;
  password: string;
  salt: string;
  clientIDs: string[];
}

export interface Ijwt {
  _id: string;
  jwt: string;
  refreshToken: string;
  clientID: string;
}

export interface ITokenGenerate {
  jwt: string;
  refreshToken: string;
  status: HttpStatus;
}

export interface IAuthCode {
  _id: string;
  auth_code: string;
  clientID: string;
  used: boolean;
}
export interface IPreLogin {
  username: string;
  password: string;
  clientID: string;
}

export interface IPostLogin {
  authorization_code?: string;
  message?: string;
  status: HttpStatus;
}

export interface IAuthorization {
  clientID: string;
  authorization_code: string;
}

export interface IverifyAccount {
  jwt: string;
}

export interface IverifyResult {
  res: boolean;
  jwt?: string;
}

export const IOjwt = object({
  _id: string().required(),
  clientID: string().required(),
  jwt: string().required(),
  refreshToken: string().required(),
});

export type IOjwtType = InferType<typeof IOjwt>;

export const IOauthCode = object({
  _id: string().required(),
  auth_code: string().required(),
  clientID: string().required(),
  used: boolean().required().default(false),
});
export const IOUserData = object({
  _id: string().required(),
  name: string().required(),
  surname: string().required(),
  age: string().required(),
  username: string().required(),
  password: string().required(),
  salt: string().required(),
  clientIDs: array().of(string().required()).required(),
});

export type IOuserType = InferType<typeof IOUserData>;
