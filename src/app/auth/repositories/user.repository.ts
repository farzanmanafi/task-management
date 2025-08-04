import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { UserRepositoryInterface } from '../interfaces/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { UserFilterDto } from '../dto/user-filter.dto';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements UserRepositoryInterface
{
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { refreshToken },
    });
  }

  async findActiveUsers(
    pagination: PaginationDto,
    filters?: UserFilterDto,
  ): Promise<{ users: User[]; total: number }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Base conditions
    queryBuilder.where('user.isActive = :isActive', { isActive: true });

    // Apply filters
    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return { users, total };
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      username: createUserDto.username.toLowerCase(),
    });

    return await this.userRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isActive: false,
    });
  }

  async activateUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isActive: true,
    });
  }
}
