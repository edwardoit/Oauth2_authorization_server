export abstract class Repository<T, ID> {
  public abstract create(id: ID, entity: T): Promise<void>;
  //overloading to implements ttl on data and use cronTab to detect expired users
  public abstract create(id: ID, entity: T, ttl: number): Promise<void>;
  public abstract update(id: ID, entity: T): Promise<void>;
  public abstract update(id: ID, entity: T, ttl: number): Promise<void>;
  public abstract upsert(id: ID, entity: T): Promise<void>;
  public abstract delete(id: ID): Promise<void>;

  public abstract findById(id: ID): Promise<T | null>;

  public async findByIdOrCompute(id: ID, fn: () => T | Promise<T>): Promise<T> {
    const existing = await this.findById(id);
    if (existing != null) {
      return existing;
    }

    const computed = await fn();
    await this.create(id, computed);
    return computed;
  }
}
