import {
  Collection,
  InsertOneResult,
  MongoServerError,
  OptionalUnlessRequiredId, //aggiorna mongo driver
  WithId,
} from 'mongodb';
import { NotFoundError } from 'rxjs';
import { Repository } from '../lib/repository';
import { Serialized } from '../lib/serializable';

export type MongoRepositoryDocument<T, ID> = Serialized<{ _id: ID } & T>;

export abstract class MongoRepository<T, ID> extends Repository<T, ID> {
  protected readonly collection: Collection<MongoRepositoryDocument<T, ID>>;

  protected constructor(collection: MongoRepository<T, ID>['collection']) {
    super();
    this.collection = collection;
  }

  protected abstract decode(enc: MongoRepositoryDocument<T, ID>): T;
  protected abstract encode(id: ID, dec: T): MongoRepositoryDocument<T, ID>;

  public async create(id: ID, entity: T): Promise<void> {
    let res: InsertOneResult<MongoRepositoryDocument<T, ID>>;
    try {
      res = await this.collection.insertOne(
        this._insertInput(this.encode(id, entity)),
      );
    } catch (err) {
      if (err instanceof MongoServerError) {
        console.log(err);
        if (err.code === 11000) {
          throw new Error(`An entity with id "${id}" already exists`);
        }
      }

      throw err;
    }

    if (res.acknowledged !== true) {
      throw '';
    }
  }

  public async update(id: ID, entity: T): Promise<void> {
    const res = await this.collection.updateOne(
      { _id: id == undefined ? undefined : id },
      { $set: this.encode(id, entity) },
    );
    if (res.matchedCount === 0) {
      throw new NotFoundError(`No entity found for id "${id}"`);
    }
  }

  public async upsert(id: ID, entity: T): Promise<void> {
    const res = await this.collection.updateOne(
      { _id: id == undefined ? undefined : id },
      { $set: this.encode(id, entity) },
      { upsert: true },
    );
    if (res.matchedCount + res.upsertedCount === 0) {
      throw new Error(`Upsert failed on entity with id "${id}"`);
    }
  }

  public async delete(id: ID): Promise<void> {
    await this.collection.deleteOne({ _id: id == undefined ? undefined : id });
  }

  public async findById(id: ID): Promise<T | null> {
    const res = await this.collection.findOne({
      _id: id == undefined ? undefined : id,
    });
    if (res == null) return null;

    return this.decode(this._findOutput(res));
  }

  protected _insertInput(
    doc: MongoRepositoryDocument<T, ID>,
  ): OptionalUnlessRequiredId<MongoRepositoryDocument<T, ID>> {
    return doc as any;
  }

  protected _findOutput(
    doc: WithId<MongoRepositoryDocument<T, ID>>,
  ): MongoRepositoryDocument<T, ID> {
    return doc as any;
  }
}
