import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TaskActivity,
  TaskActivityTypeEnum,
} from '../entities/task-activity.entity';

@Injectable()
export class TaskActivityService {
  constructor(
    @InjectRepository(TaskActivity)
    private readonly taskActivityRepository: Repository<TaskActivity>,
  ) {}

  async logActivity(
    taskId: string,
    userId: string,
    type: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<TaskActivity> {
    const activity = this.taskActivityRepository.create({
      taskId,
      userId,
      type: type as TaskActivityTypeEnum,
      description,
      metadata,
    });

    return await this.taskActivityRepository.save(activity);
  }

  async getTaskActivities(taskId: string): Promise<TaskActivity[]> {
    return await this.taskActivityRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }
}
