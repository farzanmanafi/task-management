import {
  DeepPartial,
  FindOneOptions,
  FindManyOptions,
  DeleteResult,
  UpdateResult,
} from 'typeorm';

export interface BaseRepositoryInterface<T> {
  create(data: DeepPartial<T>): T;
  save(entity: T): Promise<T>;
  findOne(options: FindOneOptions<T>): Promise<T | null>;
  findMany(options?: FindManyOptions<T>): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: DeepPartial<T>): Promise<UpdateResult>;
  delete(id: string): Promise<DeleteResult>;
  softDelete(id: string): Promise<UpdateResult>;
  restore(id: string): Promise<UpdateResult>;
  count(options?: FindManyOptions<T>): Promise<number>;
}
