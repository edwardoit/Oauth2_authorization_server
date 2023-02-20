import {
  MongoRepository,
  MongoRepositoryDocument,
} from '../mongo/mongo-repository';
import { IOUserData, Iuser } from './type/generics-interface';
import {
  Collection,
  DeleteResult,
  InsertOneResult,
  MongoClient,
} from 'mongodb';
import { serialize } from './serializable';

export type UserCaster = Iuser;

export type UserEntitiesRepositoryDocument = MongoRepositoryDocument<
  UserCaster,
  string
>;

export class UserRepository extends MongoRepository<UserCaster, string> {
  private url = 'mongodb://localhost:27017';
  private client: MongoClient = new MongoClient(this.url);
  public constructor(
    coll: Collection<MongoRepositoryDocument<UserCaster, string>>,
  ) {
    super(coll);
  }
  protected async decode(
    enc: MongoRepositoryDocument<UserCaster, string>,
  ): Promise<UserCaster> {
    return await IOUserData.validate(enc);
  }

  protected encode(
    _id: string,
    dec: UserCaster,
  ): MongoRepositoryDocument<UserCaster, string> {
    return serialize({ _id: dec.username, ...dec });
  }

  public async deleteMerchant(username: string): Promise<DeleteResult> {
    return await this.collection.deleteOne({
      _id: username,
    });
  }
  public async updateMerchant(user: UserCaster): Promise<void> {
    await this.collection.updateOne(
      {
        _id: user.username,
      },
      {
        $set: {
          ...user,
        },
      },
    );
  }
  public async findAllUser(): Promise<Promise<Iuser>[] | null> {
    const res = await this.collection.find();
    if (res == null) return null;

    return res
      .map(async (document: any) => {
        return await this.decode(this._findOutput(document));
      })
      .toArray();
  }

  public async retriveOneuser(userID: string): Promise<UserCaster | null> {
    return await this.collection.findOne({
      _id: userID,
    });
  }

  public async insertNewUser(user: UserCaster): Promise<InsertOneResult> {
    return await this.collection.insertOne({
      _id: user.username,
      ...user,
    });
  }

  public async instaceDB() {
    await this.client.connect();
    console.log('Connected successfully to server');
    const db = this.client.db('entities');
    const collection = db.collection('users');
  }
}
