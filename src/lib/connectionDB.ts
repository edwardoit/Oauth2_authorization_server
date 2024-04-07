import { UserRepository } from '../mongo/user-repository';
import { JwtRepository } from '../mongo/jwt-repository';
import { AuthCodeRepository } from '../mongo/auth_code-repository';

export const connectionUserCollection = connectToUserCollection().then(
  (instance) => {
    return new UserRepository(instance);
  },
);

async function connectToUserCollection() {
  return await UserRepository.instaceDB();
}

export const connectionTokenCollection = connectToTokenCollection().then(
  (instance) => {
    return new JwtRepository(instance);
  },
);

async function connectToTokenCollection() {
  return await JwtRepository.instaceDB();
}

export const connectionAuthCollection = connectToAuthCodeCollection().then(
  (instance) => {
    return new AuthCodeRepository(instance);
  },
);

async function connectToAuthCodeCollection() {
  return await AuthCodeRepository.instaceDB();
}
