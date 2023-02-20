import { InferType, object, string } from 'yup';

export interface CreateUserDto {
  name: string;
  surname: string;
  age: string;

  username: string;

  password: string;
}

export interface Iuser {
  _id?: string;
  name: string;
  surname: string;
  age: string;

  username: string;

  password: string;

  salt?: string;
}

export interface IPreLogin {
  username: string;
  password: string;
}

export const IOUserData = object({
  _id: string().optional(),

  name: string().required(),

  surname: string().required(),

  age: string().required(),

  username: string().required(),

  password: string().required(),

  salt: string().optional(),
});

export type IOuserType = InferType<typeof IOUserData>;
