// src/app/tasks/services/tasks.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { TaskActivityService } from './task-activity.service';
import { CacheService } from '../../../shared/cache/cache.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskFilterDto } from '../dto/task-filter.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { TaskStatusEnum } from '../enums/task-status.enum';
import { TaskPriorityEnum } from '../enums/task-priority.enum';
import { TaskIssueTypeEnum } from '../enums/task-issue-type.enum';
import { TestUtils } from '../../../../test/utils/test-utils';
import { mockCacheService } from '../../../../test/mocks/cache.service.mock';
import { mockEventEmitter } from '../../../../test/mocks/event-emitter.mock';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let taskActivityService: jest.Mocked<TaskActivityService>;
  let cacheService: jest.Mocked<typeof mockCacheService>;
  let eventEmitter: jest.Mocked<typeof mockEventEmitter>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: TestUtils.createMockRepository(Task),
        },
        {
          provide: TaskActivityService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get(getRepositoryToken(Task)) as jest.Mocked<
      Repository<Task>
    >;
    taskActivityService = module.get(
      TaskActivityService,
    ) as jest.Mocked<TaskActivityService>;
    cacheService = module.get(CacheService) as jest.Mocked<
      typeof mockCacheService
    >;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<
      typeof mockEventEmitter
    >;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test task description',
        issueType: TaskIssueTypeEnum.FEATURE,
        priority: TaskPriorityEnum.HIGH,
      };

      const mockUser = await TestUtils.createMockUser();
      const mockTask = await TestUtils.createMockTask({
        title: createTaskDto.title,
        description: createTaskDto.description,
        createdById: mockUser.id,
      });

      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);
      taskActivityService.logActivity.mockResolvedValue(undefined);

      // Mock getNextPosition method
      taskRepository.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 5 }),
      });

      const result = await service.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdById: mockUser.id,
        position: 6,
      });
      expect(taskRepository.save).toHaveBeenCalledWith(mockTask);
      expect(taskActivityService.logActivity).toHaveBeenCalledWith(
        mockTask.id,
        mockUser.id,
        'created',
        `Task created: ${mockTask.title}`,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('task.created', {
        task: mockTask,
        user: mockUser,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const filters: TaskFilterDto = {
        status: TaskStatusEnum.IN_PROGRESS,
        priority: TaskPriorityEnum.HIGH,
      };

      const pagination = new PaginationDto();
      pagination.page = 1;
      pagination.limit = 10;

      const mockUser = await TestUtils.createMockUser();
      const mockTasks = [
        await TestUtils.createMockTask({ id: '1' }),
        await TestUtils.createMockTask({ id: '2' }),
      ];

      cacheService.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTasks, 2]),
      };

      taskRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll(filters, pagination, mockUser);

      expect(result).toEqual({
        tasks: mockTasks,
        total: 2,
      });
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const filters: TaskFilterDto = {};
      const pagination = new PaginationDto();
      pagination.page = 1;
      pagination.limit = 10;

      const mockUser = await TestUtils.createMockUser();
      const cachedResult = {
        tasks: [await TestUtils.createMockTask()],
        total: 1,
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(filters, pagination, mockUser);

      expect(result).toEqual(cachedResult);
      expect(taskRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const taskId = 'test-task-id';
      const mockUser = await TestUtils.createMockUser();
      const mockTask = await TestUtils.createMockTask({
        id: taskId,
        createdById: mockUser.id,
      });

      cacheService.get.mockResolvedValue(null);
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(taskId, mockUser);

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: [
          'project',
          'assignee',
          'createdBy',
          'labels',
          'comments',
          'attachments',
        ],
      });
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent task', async () => {
      const taskId = 'non-existent-task-id';
      const mockUser = await TestUtils.createMockUser();

      cacheService.get.mockResolvedValue(null);
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(taskId, mockUser)).rejects.toThrow(
        `Task with ID ${taskId} not found`,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update task status successfully', async () => {
      const taskId = 'test-task-id';
      const newStatus = TaskStatusEnum.DONE;
      const mockUser = await TestUtils.createMockUser();
      const mockTask = await TestUtils.createMockTask({
        id: taskId,
        status: TaskStatusEnum.IN_PROGRESS,
        createdById: mockUser.id,
      });

      // Create updated task with new status
      const updatedTask = await TestUtils.createMockTask({
        ...mockTask,
        status: newStatus,
      });

      // Mock the repository methods
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(updatedTask as Task);

      // Mock cache service
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);

      const result = await service.updateStatus(taskId, newStatus, mockUser);

      expect(result.status).toBe(newStatus);
      expect(taskActivityService.logActivity).toHaveBeenCalledWith(
        taskId,
        mockUser.id,
        'status_changed',
        `Status changed from ${TaskStatusEnum.IN_PROGRESS} to ${newStatus}`,
        {
          oldStatus: TaskStatusEnum.IN_PROGRESS,
          newStatus,
        },
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('task.status_changed', {
        task: result,
        user: mockUser,
        oldStatus: TaskStatusEnum.IN_PROGRESS,
        newStatus,
      });
    });
  });

  describe('getStats', () => {
    it('should return task statistics', async () => {
      const mockUser = await TestUtils.createMockUser();
      const mockTasks = [
        await TestUtils.createMockTask({
          status: TaskStatusEnum.DONE,
          priority: TaskPriorityEnum.HIGH,
          createdById: mockUser.id,
        }),
        await TestUtils.createMockTask({
          status: TaskStatusEnum.IN_PROGRESS,
          priority: TaskPriorityEnum.MEDIUM,
          createdById: mockUser.id,
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        }),
      ];

      cacheService.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      taskRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getStats(mockUser);

      expect(result).toEqual({
        total: 2,
        completed: 1,
        inProgress: 1,
        overdue: 1,
        byPriority: {
          [TaskPriorityEnum.CRITICAL]: 0,
          [TaskPriorityEnum.URGENT]: 0,
          [TaskPriorityEnum.HIGH]: 1,
          [TaskPriorityEnum.MEDIUM]: 1,
          [TaskPriorityEnum.LOW]: 0,
        },
        byStatus: {
          [TaskStatusEnum.BACKLOG]: 0,
          [TaskStatusEnum.TODO]: 0,
          [TaskStatusEnum.IN_PROGRESS]: 1,
          [TaskStatusEnum.IN_REVIEW]: 0,
          [TaskStatusEnum.TESTING]: 0,
          [TaskStatusEnum.DONE]: 1,
          [TaskStatusEnum.CANCELLED]: 0,
        },
      });
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple tasks successfully', async () => {
      const taskIds = ['task1', 'task2'];
      const updates = { priority: TaskPriorityEnum.HIGH };
      const mockUser = await TestUtils.createMockUser();
      const mockTasks = [
        await TestUtils.createMockTask({
          id: 'task1',
          createdById: mockUser.id,
        }),
        await TestUtils.createMockTask({
          id: 'task2',
          createdById: mockUser.id,
        }),
      ];

      const updatedTasks = mockTasks.map((task) => ({ ...task, ...updates }));

      taskRepository.findByIds.mockResolvedValue(mockTasks);
      taskRepository.save.mockResolvedValue(updatedTasks as any);

      const result = await service.bulkUpdate(taskIds, updates, mockUser);

      expect(result).toHaveLength(2);
      expect(result[0].priority).toBe(TaskPriorityEnum.HIGH);
      expect(result[1].priority).toBe(TaskPriorityEnum.HIGH);
      expect(taskActivityService.logActivity).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith('tasks.bulk_updated', {
        tasks: result,
        user: mockUser,
        updates,
      });
    });
  });
});
