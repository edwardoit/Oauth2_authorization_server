import { MongoRepository, MongoRepositoryDocument } from './mongo-repository';
import { IOUserData, Iuser } from '../lib/type/generics-interface';
import {
  Collection,
  DeleteResult,
  InsertOneResult,
  MongoClient,
} from 'mongodb';
import { serialize } from '../lib/serializable';

export type UserCaster = Iuser;

export type UserEntitiesRepositoryDocument = MongoRepositoryDocument<
  UserCaster,
  string
>;

export class UserRepository extends MongoRepository<UserCaster, string> {
  public constructor(
    coll: Collection<MongoRepositoryDocument<UserCaster, string>>,
  ) {
    super(coll);
  }
  protected decode(
    enc: MongoRepositoryDocument<UserCaster, string>,
  ): UserCaster {
    return IOUserData.validateSync(enc);
  }

  protected encode(
    _id: string,
    dec: UserCaster,
  ): MongoRepositoryDocument<UserCaster, string> {
    return serialize(dec);
  }

  public async deleteUser(username: string): Promise<DeleteResult> {
    return await this.collection.deleteOne({
      username: username,
    });
  }
  public async updateUser(user: UserCaster): Promise<void> {
    await this.collection.updateOne(
      {
        username: user.username,
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
      username: userID,
    });
  }

  public async insertNewUser(user: UserCaster): Promise<InsertOneResult> {
    return await this.collection.insertOne(user);
  }

  static async instaceDB(): Promise<Collection<UserCaster>> {
    const url = 'mongodb://localhost:27017';
    const client: MongoClient = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to database instance');
    const db = client.db('entities').collection<UserCaster>('users');
    return db;
  }
}
