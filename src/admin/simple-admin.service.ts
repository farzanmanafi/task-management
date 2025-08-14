// src/admin/simple-admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../app/auth/entities/user.entity';
import { Task } from '../app/tasks/entities/task.entity';
import { Project } from '../app/projects/entities/project.entity';
import { TaskStatusEnum } from '../app/tasks/enums/task-status.enum';

@Injectable()
export class SimpleAdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalTasks, totalProjects, completedTasks] =
      await Promise.all([
        this.userRepository.count(),
        this.taskRepository.count(),
        this.projectRepository.count(),
        this.taskRepository.count({ where: { status: TaskStatusEnum.DONE } }),
      ]);

    return {
      totalUsers,
      totalTasks,
      totalProjects,
      completedTasks,
      completionRate:
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
    };
  }

  async getAllUsers() {
    return await this.userRepository.find({
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTasks() {
    return await this.taskRepository.find({
      relations: ['assignee', 'project', 'createdBy'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit for performance
    });
  }

  async getAllProjects() {
    return await this.projectRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
