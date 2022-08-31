import { Repository, EntityRepository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatusEnum } from './enum/tasks-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../auth/entities/user.entitty';
import { Delete } from '@nestjs/common';

//TODO read repository pattern
@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = new Task();
    task.description = description;
    task.title = title;
    task.status = TaskStatusEnum.OPEN;
    task.user = user;
    await task.save();

    delete task.user; //remove userInfo from obj
    return task;
  }

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<any> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('task');

    query.where('task.userId = :userId', { userId: user.id });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const tasks = await query.getMany();
  }
}
