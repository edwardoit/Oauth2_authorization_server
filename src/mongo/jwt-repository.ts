import { MongoRepository, MongoRepositoryDocument } from './mongo-repository';
import { Ijwt, IOjwt, IOUserData, Iuser } from '../lib/type/generics-interface';
import {
  Collection,
  DeleteResult,
  InsertOneResult,
  MongoClient,
  MongoServerError,
} from 'mongodb';
import { serialize } from '../lib/serializable';
import { UserCaster } from './user-repository';

export type jwtCaster = Ijwt;
export type updateJwtObj = Omit<Ijwt, '_id' | 'refreshToken'>;

export class JwtRepository extends MongoRepository<jwtCaster, string> {
  public constructor(
    coll: Collection<MongoRepositoryDocument<jwtCaster, string>>,
  ) {
    super(coll);
  }
  protected decode(enc: MongoRepositoryDocument<jwtCaster, string>): jwtCaster {
    return IOjwt.validateSync(enc);
  }

  protected encode(
    _id: string,
    dec: jwtCaster,
  ): MongoRepositoryDocument<jwtCaster, string> {
    return serialize(dec);
  }

  public async deleteJwt(jwt: string, id: string): Promise<DeleteResult> {
    return await this.collection.deleteOne({
      jwt: jwt,
      clientID: id,
    });
  }

  public async deleteAllAccessToken(id: string): Promise<DeleteResult> {
    return await this.collection.deleteOne({
      clientID: id,
    });
  }
  public async updateJwt(jwtObj: updateJwtObj): Promise<void> {
    await this.collection.updateOne(
      {
        clientID: jwtObj.clientID,
      },
      {
        $set: {
          ...jwtObj,
        },
      },
    );
  }
  public async findAllJwt(): Promise<Promise<jwtCaster>[] | null> {
    const res = await this.collection.find();
    if (res == null) return null;

    return res
      .map(async (document: any) => {
        return await this.decode(this._findOutput(document));
      })
      .toArray();
  }

  public async retriveOneJwt(
    jtwReference: string,
    id: string,
  ): Promise<jwtCaster | null> {
    return await this.collection.findOne({
      jwt: jtwReference,
      clientID: id,
    });
  }
  public async retriveByJwt(jtwReference: string): Promise<jwtCaster | null> {
    return await this.collection.findOne({
      jwt: jtwReference,
    });
  }
  public async retrivebyUsername(username: string): Promise<jwtCaster | null> {
    return await this.collection.findOne({
      username: username,
    });
  }

  public async retrivebyID(id: string): Promise<jwtCaster | null> {
    return await this.collection.findOne({
      clientID: id,
    });
  }
  public async insertNewJwt(jwtObj: jwtCaster): Promise<InsertOneResult> {
    return await this.collection.insertOne(jwtObj);
  }

  static async instaceDB(): Promise<Collection<jwtCaster>> {
    const url = 'mongodb://localhost:27017';
    const client: MongoClient = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to database instance');
    const db = client.db('entities').collection<jwtCaster>('jwt');
    return db;
  }
}
