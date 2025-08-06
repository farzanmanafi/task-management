import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskFilterDto } from '../dto/task-filter.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { User } from '../../auth/entities/user.entity';
import {
  TaskServiceInterface,
  TaskStats,
} from '../interfaces/task-service.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskStatusEnum } from '../enum/tasks-status.enum';
import { TaskActivityService } from './task-activity.service';
import { TaskPriorityEnum } from '../enum/task-priority.enum';
import { UserRoleEnum } from '@/app/auth/enum/user-role.enum';
import { CacheService } from 'src/shared/cache/cache.service';

@Injectable()
export class TaskService implements TaskServiceInterface {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly taskActivityService: TaskActivityService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    try {
      this.logger.log(
        `Creating task: ${createTaskDto.title} by user: ${user.id}`,
      );

      // Validate project access if projectId is provided
      if (createTaskDto.projectId) {
        await this.validateProjectAccess(createTaskDto.projectId, user);
      }

      // Validate assignee if assigneeId is provided
      if (createTaskDto.assigneeId) {
        await this.validateAssigneeAccess(createTaskDto.assigneeId, user);
      }

      const task = this.taskRepository.create({
        ...createTaskDto,
        createdById: user.id,
        position: await this.getNextPosition(createTaskDto.projectId),
      });

      const savedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        savedTask.id,
        user.id,
        'created',
        `Task created: ${savedTask.title}`,
      );

      // Emit event
      this.eventEmitter.emit('task.created', { task: savedTask, user });

      // Clear cache
      await this.clearTaskCache(user.id, createTaskDto.projectId);

      this.logger.log(`Task created successfully: ${savedTask.id}`);
      return savedTask;
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(
    filters: TaskFilterDto,
    pagination: PaginationDto,
    user: User,
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      const cacheKey = this.cacheService.generateKey(
        'tasks',
        user.id,
        JSON.stringify(filters),
        JSON.stringify(pagination),
      );

      const cachedResult = await this.cacheService.get<{
        tasks: Task[];
        total: number;
      }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const queryBuilder = this.createTaskQuery(filters, user);

      // Apply pagination
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Apply sorting
      this.applySorting(queryBuilder, filters);

      const [tasks, total] = await queryBuilder.getManyAndCount();

      const result = { tasks, total };

      // Cache the result
      await this.cacheService.set(cacheKey, result, 300); // 5 minutes

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch tasks: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, user: User): Promise<Task> {
    try {
      const cacheKey = this.cacheService.generateKey('task', id, user.id);
      const cachedTask = await this.cacheService.get<Task>(cacheKey);
      if (cachedTask) {
        return cachedTask;
      }

      const task = await this.taskRepository.findOne({
        where: { id },
        relations: [
          'project',
          'assignee',
          'createdBy',
          'labels',
          'comments',
          'attachments',
        ],
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      // Check permissions
      await this.validateTaskAccess(task, user);

      // Cache the task
      await this.cacheService.set(cacheKey, task, 300); // 5 minutes

      return task;
    } catch (error) {
      this.logger.error(
        `Failed to fetch task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    try {
      this.logger.log(`Updating task ${id} by user: ${user.id}`);

      const task = await this.findOne(id, user);

      // Validate project access if projectId is being changed
      if (
        updateTaskDto.projectId &&
        updateTaskDto.projectId !== task.projectId
      ) {
        await this.validateProjectAccess(updateTaskDto.projectId, user);
      }

      // Validate assignee if assigneeId is being changed
      if (
        updateTaskDto.assigneeId &&
        updateTaskDto.assigneeId !== task.assigneeId
      ) {
        await this.validateAssigneeAccess(updateTaskDto.assigneeId, user);
      }

      // Log changes
      const changes = this.getChanges(task, updateTaskDto);

      // Update task
      Object.assign(task, updateTaskDto);
      const updatedTask = await this.taskRepository.save(task);

      // Log activity for significant changes
      if (changes.length > 0) {
        await this.taskActivityService.logActivity(
          task.id,
          user.id,
          'updated',
          `Task updated: ${changes.join(', ')}`,
          { changes },
        );
      }

      // Emit event
      this.eventEmitter.emit('task.updated', {
        task: updatedTask,
        user,
        changes,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      this.logger.log(`Task updated successfully: ${id}`);
      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to update task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string, user: User): Promise<void> {
    try {
      this.logger.log(`Deleting task ${id} by user: ${user.id}`);

      const task = await this.findOne(id, user);

      // Check if user can delete the task
      if (!this.canDeleteTask(task, user)) {
        throw new ForbiddenException(
          'You do not have permission to delete this task',
        );
      }

      await this.taskRepository.softDelete(id);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'deleted',
        `Task deleted: ${task.title}`,
      );

      // Emit event
      this.eventEmitter.emit('task.deleted', { task, user });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      this.logger.log(`Task deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: TaskStatusEnum,
    user: User,
  ): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      const oldStatus = task.status;

      task.updateStatus(status);
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'status_changed',
        `Status changed from ${oldStatus} to ${status}`,
        { oldStatus, newStatus: status },
      );

      // Emit event
      this.eventEmitter.emit('task.status_changed', {
        task: updatedTask,
        user,
        oldStatus,
        newStatus: status,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to update task status ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updatePriority(
    id: string,
    priority: TaskPriorityEnum,
    user: User,
  ): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      const oldPriority = task.priority;

      task.updatePriority(priority);
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'priority_changed',
        `Priority changed from ${oldPriority} to ${priority}`,
        { oldPriority, newPriority: priority },
      );

      // Emit event
      this.eventEmitter.emit('task.priority_changed', {
        task: updatedTask,
        user,
        oldPriority,
        newPriority: priority,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to update task priority ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async assign(id: string, assigneeId: string, user: User): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      await this.validateAssigneeAccess(assigneeId, user);

      const oldAssigneeId = task.assigneeId;
      task.assignTo(assigneeId);
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'assigned',
        `Task assigned to user ${assigneeId}`,
        { oldAssigneeId, newAssigneeId: assigneeId },
      );

      // Emit event
      this.eventEmitter.emit('task.assigned', {
        task: updatedTask,
        user,
        assigneeId,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to assign task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async unassign(id: string, user: User): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      const oldAssigneeId = task.assigneeId;

      task.unassign();
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'unassigned',
        'Task unassigned',
        { oldAssigneeId },
      );

      // Emit event
      this.eventEmitter.emit('task.unassigned', {
        task: updatedTask,
        user,
        oldAssigneeId,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to unassign task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async addTimeEntry(id: string, hours: number, user: User): Promise<Task> {
    try {
      if (hours <= 0) {
        throw new BadRequestException('Hours must be greater than 0');
      }

      const task = await this.findOne(id, user);
      task.addTimeSpent(hours);
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'time_logged',
        `${hours} hours logged`,
        { hours, totalHours: updatedTask.actualHours },
      );

      // Emit event
      this.eventEmitter.emit('task.time_logged', {
        task: updatedTask,
        user,
        hours,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to add time entry for task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async block(id: string, reason: string, user: User): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      task.setBlocked(reason);
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'blocked',
        `Task blocked: ${reason}`,
        { reason },
      );

      // Emit event
      this.eventEmitter.emit('task.blocked', {
        task: updatedTask,
        user,
        reason,
      });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to block task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async unblock(id: string, user: User): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      task.unblock();
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'unblocked',
        'Task unblocked',
      );

      // Emit event
      this.eventEmitter.emit('task.unblocked', { task: updatedTask, user });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to unblock task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async archive(id: string, user: User): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      task.archive();
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'archived',
        'Task archived',
      );

      // Emit event
      this.eventEmitter.emit('task.archived', { task: updatedTask, user });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to archive task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async unarchive(id: string, user: User): Promise<Task> {
    try {
      const task = await this.findOne(id, user);
      task.unarchive();
      const updatedTask = await this.taskRepository.save(task);

      // Log activity
      await this.taskActivityService.logActivity(
        task.id,
        user.id,
        'unarchived',
        'Task unarchived',
      );

      // Emit event
      this.eventEmitter.emit('task.unarchived', { task: updatedTask, user });

      // Clear cache
      await this.clearTaskCache(user.id, task.projectId);

      return updatedTask;
    } catch (error) {
      this.logger.error(
        `Failed to unarchive task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getStats(user: User, projectId?: string): Promise<TaskStats> {
    try {
      const cacheKey = this.cacheService.generateKey(
        'task_stats',
        user.id,
        projectId || 'all',
      );
      const cachedStats = await this.cacheService.get<TaskStats>(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const query = this.taskRepository
        .createQueryBuilder('task')
        .where('task.createdById = :userId OR task.assigneeId = :userId', {
          userId: user.id,
        })
        .andWhere('task.deletedAt IS NULL');

      if (projectId) {
        query.andWhere('task.projectId = :projectId', { projectId });
      }

      const tasks = await query.getMany();
      const now = new Date();

      const stats: TaskStats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === TaskStatusEnum.DONE).length,
        inProgress: tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS)
          .length,
        overdue: tasks.filter(
          (t) =>
            t.dueDate && t.dueDate < now && t.status !== TaskStatusEnum.DONE,
        ).length,
        byPriority: {} as Record<TaskPriorityEnum, number>,
        byStatus: {} as Record<TaskStatusEnum, number>,
      };

      // Calculate priority distribution
      Object.values(TaskPriorityEnum).forEach((priority) => {
        stats.byPriority[priority] = tasks.filter(
          (t) => t.priority === priority,
        ).length;
      });

      // Calculate status distribution
      Object.values(TaskStatusEnum).forEach((status) => {
        stats.byStatus[status] = tasks.filter(
          (t) => t.status === status,
        ).length;
      });

      // Cache the stats
      await this.cacheService.set(cacheKey, stats, 600); // 10 minutes

      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to get task stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getOverdueTasks(user: User): Promise<Task[]> {
    try {
      const now = new Date();
      return await this.taskRepository
        .createQueryBuilder('task')
        .where('task.assigneeId = :userId', { userId: user.id })
        .andWhere('task.dueDate < :now', { now })
        .andWhere('task.status != :doneStatus', {
          doneStatus: TaskStatusEnum.DONE,
        })
        .andWhere('task.deletedAt IS NULL')
        .orderBy('task.dueDate', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get overdue tasks: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getTasksByProject(projectId: string, user: User): Promise<Task[]> {
    try {
      await this.validateProjectAccess(projectId, user);

      return await this.taskRepository
        .createQueryBuilder('task')
        .where('task.projectId = :projectId', { projectId })
        .andWhere('task.deletedAt IS NULL')
        .orderBy('task.position', 'ASC')
        .addOrderBy('task.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get tasks by project: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async bulkUpdate(
    ids: string[],
    updates: Partial<UpdateTaskDto>,
    user: User,
  ): Promise<Task[]> {
    try {
      this.logger.log(`Bulk updating ${ids.length} tasks by user: ${user.id}`);

      const tasks = await this.taskRepository.findByIds(ids);

      // Validate access to all tasks
      for (const task of tasks) {
        await this.validateTaskAccess(task, user);
      }

      // Apply updates
      const updatedTasks = await this.taskRepository.save(
        tasks.map((task) => ({ ...task, ...updates })),
      );

      // Log activities
      for (const task of updatedTasks) {
        await this.taskActivityService.logActivity(
          task.id,
          user.id,
          'bulk_updated',
          'Task updated via bulk operation',
          { updates },
        );
      }

      // Emit event
      this.eventEmitter.emit('tasks.bulk_updated', {
        tasks: updatedTasks,
        user,
        updates,
      });

      // Clear cache
      await this.clearTaskCache(user.id);

      return updatedTasks;
    } catch (error) {
      this.logger.error(
        `Failed to bulk update tasks: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private createTaskQuery(
    filters: TaskFilterDto,
    user: User,
  ): SelectQueryBuilder<Task> {
    const query = this.taskRepository.createQueryBuilder('task');

    // Base filters
    if (user.role !== UserRoleEnum.ADMIN) {
      query.where('(task.createdById = :userId OR task.assigneeId = :userId)', {
        userId: user.id,
      });
    }

    query.andWhere('task.deletedAt IS NULL');

    // Apply filters
    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.issueType) {
      query.andWhere('task.issueType = :issueType', {
        issueType: filters.issueType,
      });
    }

    if (filters.assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }

    if (filters.projectId) {
      query.andWhere('task.projectId = :projectId', {
        projectId: filters.projectId,
      });
    }

    if (filters.createdById) {
      query.andWhere('task.createdById = :createdById', {
        createdById: filters.createdById,
      });
    }

    if (filters.dueDateFrom && filters.dueDateTo) {
      query.andWhere('task.dueDate BETWEEN :dueDateFrom AND :dueDateTo', {
        dueDateFrom: filters.dueDateFrom,
        dueDateTo: filters.dueDateTo,
      });
    } else if (filters.dueDateFrom) {
      query.andWhere('task.dueDate >= :dueDateFrom', {
        dueDateFrom: filters.dueDateFrom,
      });
    } else if (filters.dueDateTo) {
      query.andWhere('task.dueDate <= :dueDateTo', {
        dueDateTo: filters.dueDateTo,
      });
    }

    if (filters.isOverdue) {
      query.andWhere('task.dueDate < :now', { now: new Date() });
      query.andWhere('task.status != :doneStatus', {
        doneStatus: TaskStatusEnum.DONE,
      });
    }

    if (filters.isBlocked !== undefined) {
      query.andWhere('task.isBlocked = :isBlocked', {
        isBlocked: filters.isBlocked,
      });
    }

    if (filters.isArchived !== undefined) {
      query.andWhere('task.isArchived = :isArchived', {
        isArchived: filters.isArchived,
      });
    }

    if (filters.myTasks) {
      query.andWhere('task.assigneeId = :userId', { userId: user.id });
    }

    if (filters.unassigned) {
      query.andWhere('task.assigneeId IS NULL');
    }

    if (filters.search) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return query;
  }

  private applySorting(
    query: SelectQueryBuilder<Task>,
    filters: TaskFilterDto,
  ): void {
    const sortField = filters.sortField || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortField) {
      case 'priority':
        // Custom priority sorting
        query.orderBy(
          'CASE task.priority WHEN :critical THEN 1 WHEN :urgent THEN 2 WHEN :high THEN 3 WHEN :medium THEN 4 WHEN :low THEN 5 END',
          sortOrder,
        );
        query.setParameters({
          critical: TaskPriorityEnum.CRITICAL,
          urgent: TaskPriorityEnum.URGENT,
          high: TaskPriorityEnum.HIGH,
          medium: TaskPriorityEnum.MEDIUM,
          low: TaskPriorityEnum.LOW,
        });
        break;
      case 'status':
        // Custom status sorting
        query.orderBy(
          'CASE task.status WHEN :inProgress THEN 1 WHEN :inReview THEN 2 WHEN :todo THEN 3 WHEN :backlog THEN 4 WHEN :done THEN 5 WHEN :cancelled THEN 6 END',
          sortOrder,
        );
        query.setParameters({
          inProgress: TaskStatusEnum.IN_PROGRESS,
          inReview: TaskStatusEnum.IN_REVIEW,
          todo: TaskStatusEnum.TODO,
          backlog: TaskStatusEnum.BACKLOG,
          done: TaskStatusEnum.DONE,
          cancelled: TaskStatusEnum.CANCELLED,
        });
        break;
      case 'dueDate':
        query.orderBy('task.dueDate', sortOrder, 'NULLS LAST');
        break;
      default:
        query.orderBy(`task.${sortField}`, sortOrder);
    }

    // Secondary sort by creation date
    query.addOrderBy('task.createdAt', 'DESC');
  }

  private async validateTaskAccess(task: Task, user: User): Promise<void> {
    if (user.role === UserRoleEnum.ADMIN) {
      return;
    }

    const hasAccess =
      task.createdById === user.id ||
      task.assigneeId === user.id ||
      (task.projectId &&
        (await this.validateProjectAccess(task.projectId, user, false)));

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this task');
    }
  }

  private async validateProjectAccess(
    projectId: string,
    user: User,
    throwError: boolean = true,
  ): Promise<boolean> {
    // Implementation would check if user has access to the project
    // This is a placeholder - implement based on your project access logic
    return true;
  }

  private async validateAssigneeAccess(
    assigneeId: string,
    user: User,
  ): Promise<void> {
    // Implementation would check if user can assign tasks to the assignee
    // This is a placeholder - implement based on your assignment logic
  }

  private canDeleteTask(task: Task, user: User): boolean {
    return (
      user.role === UserRoleEnum.ADMIN ||
      user.role === UserRoleEnum.PROJECT_MANAGER ||
      task.createdById === user.id
    );
  }

  private async getNextPosition(projectId?: string): Promise<number> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .select('MAX(task.position)', 'maxPosition')
      .where('task.deletedAt IS NULL');

    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    } else {
      query.andWhere('task.projectId IS NULL');
    }

    const result = await query.getRawOne();
    return (result?.maxPosition || 0) + 1;
  }

  private getChanges(task: Task, updates: UpdateTaskDto): string[] {
    const changes: string[] = [];

    if (updates.title && updates.title !== task.title) {
      changes.push(`title changed from "${task.title}" to "${updates.title}"`);
    }

    if (updates.status && updates.status !== task.status) {
      changes.push(
        `status changed from "${task.status}" to "${updates.status}"`,
      );
    }

    if (updates.priority && updates.priority !== task.priority) {
      changes.push(
        `priority changed from "${task.priority}" to "${updates.priority}"`,
      );
    }

    if (
      updates.assigneeId !== undefined &&
      updates.assigneeId !== task.assigneeId
    ) {
      changes.push(`assignee changed`);
    }

    if (updates.dueDate && updates.dueDate !== task.dueDate?.toISOString()) {
      changes.push(`due date changed`);
    }

    return changes;
  }

  private async clearTaskCache(
    userId: string,
    projectId?: string,
  ): Promise<void> {
    const patterns = [
      `tasks:${userId}:*`,
      `task:*:${userId}`,
      `task_stats:${userId}:*`,
    ];

    if (projectId) {
      patterns.push(`project_tasks:${projectId}:*`);
    }

    await Promise.all(
      patterns.map((pattern) => this.cacheService.delPattern(pattern)),
    );
  }
}
