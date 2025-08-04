import { User } from '../entities/user.entity';
import { BaseRepositoryInterface } from '../../../shared/interfaces/repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { UserFilterDto } from '../dto/user-filter.dto';

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByRefreshToken(refreshToken: string): Promise<User | null>;
  findActiveUsers(
    pagination: PaginationDto,
    filters?: UserFilterDto,
  ): Promise<{ users: User[]; total: number }>;
  createUser(createUserDto: CreateUserDto): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;
  deactivateUser(userId: string): Promise<void>;
  activateUser(userId: string): Promise<void>;
}
