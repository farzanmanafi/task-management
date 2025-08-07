import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from '../../src/app/auth/entities/user.entity';
import { Task } from '../../src/app/tasks/entities/task.entity';
import { Project } from '../../src/app/projects/entities/project.entity';
import { Label } from '../../src/app/labels/entities/label.entity';

import * as bcrypt from 'bcrypt';
import { UserRoleEnum } from '../../src/app/auth/enum/user-role.enum';
import {
  TaskIssueTypeEnum,
  TaskPriorityEnum,
  TaskStatusEnum,
} from '@/app/tasks/enums';
import { ProjectStatusEnum } from '@/app/projects/enum/project-status.enum';

export class TestUtils {
  static async createTestModule(
    providers: any[] = [],
    imports: any[] = [],
  ): Promise<TestingModule> {
    return await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User, Task, Project, Label],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([User, Task, Project, Label]),
        ...imports,
      ],
      providers: [...providers],
    }).compile();
  }

  static async createMockUser(overrides: Partial<User> = {}): Promise<User> {
    const user = new User();
    user.id = overrides.id || 'test-user-id';
    user.email = overrides.email || 'test@example.com';
    user.username = overrides.username || 'testuser';
    user.firstName = overrides.firstName || 'Test';
    user.lastName = overrides.lastName || 'User';
    user.password =
      overrides.password || (await bcrypt.hash('password123', 10));
    user.role = overrides.role || UserRoleEnum.USER;
    user.isActive = overrides.isActive ?? true;
    user.isEmailVerified = overrides.isEmailVerified ?? true;
    user.createdAt = overrides.createdAt || new Date();
    user.updatedAt = overrides.updatedAt || new Date();

    return Object.assign(user, overrides);
  }

  static async createMockTask(overrides: Partial<Task> = {}): Promise<Task> {
    // Create a proper Task instance with all required methods and getters
    const task = new Task();

    // Basic properties
    task.id = overrides.id || 'test-task-id';
    task.title = overrides.title || 'Test Task';
    task.description = overrides.description || 'Test task description';
    task.status = overrides.status || TaskStatusEnum.BACKLOG;
    task.priority = overrides.priority || TaskPriorityEnum.MEDIUM;
    task.issueType = overrides.issueType || TaskIssueTypeEnum.FEATURE;
    task.createdById = overrides.createdById || 'test-user-id';
    task.estimatedHours = overrides.estimatedHours || 8;
    task.actualHours = overrides.actualHours || 0;
    task.storyPoints = overrides.storyPoints || 5;
    task.position = overrides.position || 1;
    task.isBlocked = overrides.isBlocked ?? false;
    task.isArchived = overrides.isArchived ?? false;
    task.createdAt = overrides.createdAt || new Date();
    task.updatedAt = overrides.updatedAt || new Date();

    // Add missing computed properties as getters
    Object.defineProperty(task, 'isOverdue', {
      get: function () {
        if (!this.dueDate) return false;
        return new Date() > this.dueDate && this.status !== TaskStatusEnum.DONE;
      },
    });

    Object.defineProperty(task, 'progressPercentage', {
      get: function () {
        if (!this.estimatedHours || this.estimatedHours === 0) return 0;
        return Math.min(100, (this.actualHours / this.estimatedHours) * 100);
      },
    });

    Object.defineProperty(task, 'isCompleted', {
      get: function () {
        return this.status === TaskStatusEnum.DONE;
      },
    });

    Object.defineProperty(task, 'timeSpent', {
      get: function () {
        return this.actualHours || 0;
      },
    });

    Object.defineProperty(task, 'timeRemaining', {
      get: function () {
        if (!this.estimatedHours) return 0;
        return Math.max(0, this.estimatedHours - this.actualHours);
      },
    });

    // Add missing methods
    task.assignTo = jest.fn().mockImplementation((userId: string) => {
      task.assigneeId = userId;
    });

    task.unassign = jest.fn().mockImplementation(() => {
      task.assigneeId = null;
    });

    task.updateStatus = jest
      .fn()
      .mockImplementation((status: TaskStatusEnum) => {
        task.status = status;
        if (status === TaskStatusEnum.DONE) {
          task.completedAt = new Date();
        } else {
          task.completedAt = null;
        }
      });

    task.updatePriority = jest
      .fn()
      .mockImplementation((priority: TaskPriorityEnum) => {
        task.priority = priority;
      });

    task.addTimeSpent = jest.fn().mockImplementation((hours: number) => {
      task.actualHours = (task.actualHours || 0) + hours;
    });

    task.setBlocked = jest.fn().mockImplementation((reason: string) => {
      task.isBlocked = true;
      task.blockedReason = reason;
    });

    task.unblock = jest.fn().mockImplementation(() => {
      task.isBlocked = false;
      task.blockedReason = null;
    });

    task.archive = jest.fn().mockImplementation(() => {
      task.isArchived = true;
    });

    task.unarchive = jest.fn().mockImplementation(() => {
      task.isArchived = false;
    });

    task.updatePosition = jest.fn().mockImplementation((position: number) => {
      task.position = position;
    });

    task.setMetadata = jest
      .fn()
      .mockImplementation((key: string, value: any) => {
        if (!task.metadata) {
          task.metadata = {};
        }
        task.metadata[key] = value;
      });

    task.getMetadata = jest.fn().mockImplementation((key: string) => {
      return task.metadata?.[key];
    });

    task.removeMetadata = jest.fn().mockImplementation((key: string) => {
      if (task.metadata) {
        delete task.metadata[key];
      }
    });

    // Apply overrides
    Object.assign(task, overrides);

    return task;
  }

  static async createMockProject(
    overrides: Partial<Project> = {},
  ): Promise<Project> {
    const project = new Project();
    project.id = overrides.id || 'test-project-id'; // Changed to string
    project.name = overrides.name || 'Test Project';
    project.description = overrides.description || 'Test project description';
    project.status = overrides.status || ProjectStatusEnum.ACTIVE;
    project.userId = overrides.userId || 'test-user-id'; // Changed to string
    project.startDate = overrides.startDate || new Date();
    project.endDate =
      overrides.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return Object.assign(project, overrides);
  }

  static createMockPagination(page: number = 1, limit: number = 10) {
    return {
      page,
      limit,
      get offset() {
        return (this.page - 1) * this.limit;
      },
    };
  }

  static async cleanDatabase(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }

  static createMockRepository<T>(entity: new () => T) {
    return {
      create: jest
        .fn()
        .mockImplementation((data) => Object.assign(new entity(), data)),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findOneBy: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn().mockResolvedValue([]), // Added missing method
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      restore: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue(null),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        getRawOne: jest.fn().mockResolvedValue(null),
        getRawMany: jest.fn().mockResolvedValue([]),
      }),
    };
  }
}
