// src/app/tasks/interfaces/task-service.interface.ts
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { PaginationDto } from '../../../shared/dto/pagination.dto';
import { User } from '../../auth/entities/user.entity';
import { TaskStatusEnum } from '../enum/tasks-status.enum';
import { TaskFilterDto } from '../dto/task-filter.dto';
import { TaskPriorityEnum } from '../enum/task-priority.enum';

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  byPriority: Record<TaskPriorityEnum, number>;
  byStatus: Record<TaskStatusEnum, number>;
}

export interface TaskServiceInterface {
  create(createTaskDto: CreateTaskDto, user: User): Promise<Task>;
  findAll(
    filters: TaskFilterDto,
    pagination: PaginationDto,
    user: User,
  ): Promise<{ tasks: Task[]; total: number }>;
  findOne(id: string, user: User): Promise<Task>;
  update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task>;
  remove(id: string, user: User): Promise<void>;
  updateStatus(id: string, status: TaskStatusEnum, user: User): Promise<Task>;
  updatePriority(
    id: string,
    priority: TaskPriorityEnum,
    user: User,
  ): Promise<Task>;
  assign(id: string, assigneeId: string, user: User): Promise<Task>;
  unassign(id: string, user: User): Promise<Task>;
  addTimeEntry(id: string, hours: number, user: User): Promise<Task>;
  block(id: string, reason: string, user: User): Promise<Task>;
  unblock(id: string, user: User): Promise<Task>;
  archive(id: string, user: User): Promise<Task>;
  unarchive(id: string, user: User): Promise<Task>;
  getStats(user: User, projectId?: string): Promise<TaskStats>;
  getOverdueTasks(user: User): Promise<Task[]>;
  getTasksByProject(projectId: string, user: User): Promise<Task[]>;
  bulkUpdate(
    ids: string[],
    updates: Partial<UpdateTaskDto>,
    user: User,
  ): Promise<Task[]>;
}
