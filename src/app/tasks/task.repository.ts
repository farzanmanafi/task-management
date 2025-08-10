import { Repository, EntityRepository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../auth/entities/user.entity';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { TaskStatusEnum } from './enums';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger('TaskRepository');

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    // Create task instance using repository.create
    const task = this.create({
      title,
      description,
      status: TaskStatusEnum.TODO, // Fixed: Use TODO instead of OPEN
      createdById: user.id, // Fixed: Use createdById instead of user
    });

    try {
      // Save using repository.save instead of task.save()
      await this.save(task);
      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create a task for user "${
          user.username
        }"., Data: ${JSON.stringify(createTaskDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('task');

    // Fixed: Use createdById or assigneeId instead of userId
    query.where('(task.createdById = :userId OR task.assigneeId = :userId)', {
      userId: user.id,
    });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for user "${
          user.username
        }"., Filters: ${JSON.stringify(filterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
