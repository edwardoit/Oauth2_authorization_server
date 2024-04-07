import { MongoRepository, MongoRepositoryDocument } from './mongo-repository';
import { IAuthCode, IOauthCode } from '../lib/type/generics-interface';
import {
  Collection,
  DeleteResult,
  InsertOneResult,
  MongoClient,
} from 'mongodb';
import { serialize } from '../lib/serializable';

export type authCodeCaster = IAuthCode;
export type updateAuthCodeObj = Omit<IAuthCode, '_id'>;

export class AuthCodeRepository extends MongoRepository<
  authCodeCaster,
  string
> {
  public constructor(
    coll: Collection<MongoRepositoryDocument<authCodeCaster, string>>,
  ) {
    super(coll);
  }
  protected decode(
    enc: MongoRepositoryDocument<authCodeCaster, string>,
  ): authCodeCaster {
    return IOauthCode.validateSync(enc);
  }

  protected encode(
    _id: string,
    dec: authCodeCaster,
  ): MongoRepositoryDocument<authCodeCaster, string> {
    return serialize(dec);
  }

  public async deleteAuthCode(
    authCode: string,
    username: string,
  ): Promise<DeleteResult> {
    return await this.collection.deleteOne({
      auth_code: authCode,
      clientID: username,
    });
  }
  public async updateAuthCode(authObj: updateAuthCodeObj): Promise<void> {
    await this.collection.updateOne(
      {
        clientID: authObj.clientID,
      },
      {
        $set: {
          ...authObj,
        },
      },
    );
  }
  public async findAllAuthCode(): Promise<Promise<authCodeCaster>[] | null> {
    const res = await this.collection.find();
    if (res == null) return null;

    return res
      .map(async (document: any) => {
        return await this.decode(this._findOutput(document));
      })
      .toArray();
  }

  public async retriveOneAuthCode(
    authCode: string,
    id: string,
  ): Promise<authCodeCaster | null> {
    return await this.collection.findOne({
      auth_code: authCode,
      clientID: id,
    });
  }

  public async retriveOneAuthCodeByID(
    id: string,
  ): Promise<authCodeCaster | null> {
    return await this.collection.findOne({
      clientID: id,
    });
  }
  public async retriveByAuthCode(
    auth_code: string,
  ): Promise<authCodeCaster | null> {
    return await this.collection.findOne({
      auth_code: auth_code,
    });
  }

  public async retrivebyID(id: string): Promise<authCodeCaster | null> {
    return await this.collection.findOne({
      clientID: id,
    });
  }
  public async insertNewAuthCode(
    authCodeObj: authCodeCaster,
  ): Promise<InsertOneResult> {
    return await this.collection.insertOne(authCodeObj);
  }

  static async instaceDB(): Promise<Collection<authCodeCaster>> {
    const url = 'mongodb://localhost:27017';
    const client: MongoClient = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to database instance');
    const db = client.db('entities').collection<authCodeCaster>('auth_code');
    return db;
  }
}
