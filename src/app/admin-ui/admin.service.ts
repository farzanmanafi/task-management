import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { UserRoleEnum } from '../auth/enum/user-role.enum';
import { TaskStatusEnum } from '../tasks/enums/task-status.enum';
import { PaginationDto } from '../../shared/dto/pagination.dto';

interface UserFilters {
  search?: string;
  role?: UserRoleEnum;
}

interface TaskFilters {
  search?: string;
  status?: string;
}

interface ProjectFilters {
  search?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async getDashboardStats() {
    const [userCount, taskCount, projectCount, activeUsers] = await Promise.all(
      [
        this.userRepository.count(),
        this.taskRepository.count(),
        this.projectRepository.count(),
        this.userRepository.count({ where: { isActive: true } }),
      ],
    );

    const tasksByStatus = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status, COUNT(*) as count')
      .groupBy('task.status')
      .getRawMany();

    return {
      users: {
        total: userCount,
        active: activeUsers,
        inactive: userCount - activeUsers,
      },
      tasks: {
        total: taskCount,
        byStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.task_status] = parseInt(item.count);
          return acc;
        }, {}),
      },
      projects: {
        total: projectCount,
      },
    };
  }

  async getUsers(pagination: PaginationDto, filters: UserFilters) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filters.search) {
      queryBuilder.where(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    queryBuilder.skip(skip).take(limit).orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();
    return { users, total };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async activateUser(id: string): Promise<void> {
    const result = await this.userRepository.update(id, { isActive: true });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async deactivateUser(id: string): Promise<void> {
    const result = await this.userRepository.update(id, { isActive: false });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async getTasks(pagination: PaginationDto, filters: TaskFilters) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.project', 'project');

    if (filters.search) {
      queryBuilder.where(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: filters.status,
      });
    }

    queryBuilder.skip(skip).take(limit).orderBy('task.createdAt', 'DESC');

    const [tasks, total] = await queryBuilder.getManyAndCount();
    return { tasks, total };
  }

  async getProjects(pagination: PaginationDto, filters: ProjectFilters) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user');

    if (filters.search) {
      queryBuilder.where(
        '(project.name ILIKE :search OR project.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.skip(skip).take(limit).orderBy('project.createdAt', 'DESC');

    const [projects, total] = await queryBuilder.getManyAndCount();
    return { projects, total };
  }

  async getSystemStats() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      newUsersToday,
      newUsersThisWeek,
      newTasksToday,
      newTasksThisWeek,
      completedTasksToday,
      completedTasksThisWeek,
    ] = await Promise.all([
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(dayAgo) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(weekAgo) },
      }),
      this.taskRepository.count({
        where: { createdAt: MoreThanOrEqual(dayAgo) },
      }),
      this.taskRepository.count({
        where: { createdAt: MoreThanOrEqual(weekAgo) },
      }),
      this.taskRepository.count({
        where: {
          status: TaskStatusEnum.DONE,
          completedAt: MoreThanOrEqual(dayAgo),
        },
      }),
      this.taskRepository.count({
        where: {
          status: TaskStatusEnum.DONE,
          completedAt: MoreThanOrEqual(weekAgo),
        },
      }),
    ]);

    return {
      users: { newToday: newUsersToday, newThisWeek: newUsersThisWeek },
      tasks: {
        newToday: newTasksToday,
        newThisWeek: newTasksThisWeek,
        completedToday: completedTasksToday,
        completedThisWeek: completedTasksThisWeek,
      },
    };
  }

  async getSystemHealth() {
    let databaseStatus = 'healthy';
    try {
      await this.userRepository.count();
    } catch (error) {
      databaseStatus = 'unhealthy';
    }

    return {
      status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: { database: databaseStatus },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
