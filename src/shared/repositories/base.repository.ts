import { Injectable } from '@nestjs/common';
import {
  Repository,
  DeepPartial,
  FindOneOptions,
  FindManyOptions,
  DeleteResult,
  UpdateResult,
} from 'typeorm';
import { BaseRepositoryInterface } from '../interfaces/repository.interface';

@Injectable()
export abstract class BaseRepository<T> implements BaseRepositoryInterface<T> {
  constructor(protected readonly repository: Repository<T>) {}

  create(data: DeepPartial<T>): T {
    return this.repository.create(data);
  }

  async save(entity: T): Promise<T> {
    return await this.repository.save(entity);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.repository.findOne(options);
  }

  async findMany(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async findById(id: string): Promise<T | null> {
    return await this.repository.findOne({
      where: { id },
    } as FindOneOptions<T>);
  }

  async update(id: string, data: DeepPartial<T>): Promise<UpdateResult> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<DeleteResult> {
    return await this.repository.delete(id);
  }

  async softDelete(id: string): Promise<UpdateResult> {
    return await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<UpdateResult> {
    return await this.repository.restore(id);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return await this.repository.count(options);
  }
}
