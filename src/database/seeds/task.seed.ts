import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../app/tasks/entities/task.entity';
import { User } from '../../app/auth/entities/user.entity';
import { Project } from '../../app/projects/entities/project.entity';
import { TaskStatusEnum } from '../../app/tasks/enums/task-status.enum';
import { TaskPriorityEnum } from '../../app/tasks/enums/task-priority.enum';
import { TaskIssueTypeEnum } from '../../app/tasks/enums/task-issue-type.enum';

@Injectable()
export class TaskSeeder {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding tasks...');

    const users = await this.userRepository.find();
    const projects = await this.projectRepository.find();

    if (users.length === 0 || projects.length === 0) {
      console.error(
        'Users or projects not found. Please run other seeders first.',
      );
      return;
    }

    const admin = users.find((u) => u.email === 'admin@taskmanagement.com');
    const pm = users.find((u) => u.email === 'pm@taskmanagement.com');
    const dev1 = users.find((u) => u.email === 'dev1@taskmanagement.com');
    const dev2 = users.find((u) => u.email === 'dev2@taskmanagement.com');
    const project1 = projects.find((p) => p.name === 'Task Management System');
    const project2 = projects.find((p) => p.name === 'Mobile App Development');

    const tasks = [
      {
        title: 'Setup Project Architecture',
        description:
          'Initialize project structure with NestJS, TypeORM, and PostgreSQL',
        status: TaskStatusEnum.DONE,
        priority: TaskPriorityEnum.HIGH,
        issueType: TaskIssueTypeEnum.FEATURE,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-05'),
        completedAt: new Date('2024-01-04'),
        estimatedHours: 16,
        actualHours: 14,
        storyPoints: 8,
        createdById: pm.id,
        assigneeId: dev1.id,
        projectId: project1.id,
        position: 1,
      },
      {
        title: 'Implement User Authentication',
        description:
          'JWT-based authentication with login, registration, and password reset',
        status: TaskStatusEnum.DONE,
        priority: TaskPriorityEnum.HIGH,
        issueType: TaskIssueTypeEnum.FEATURE,
        startDate: new Date('2024-01-06'),
        dueDate: new Date('2024-01-12'),
        completedAt: new Date('2024-01-11'),
        estimatedHours: 20,
        actualHours: 18,
        storyPoints: 13,
        createdById: pm.id,
        assigneeId: dev2.id,
        projectId: project1.id,
        position: 2,
      },
      {
        title: 'Create Task Management API',
        description:
          'CRUD operations for tasks with advanced filtering and sorting',
        status: TaskStatusEnum.IN_PROGRESS,
        priority: TaskPriorityEnum.HIGH,
        issueType: TaskIssueTypeEnum.FEATURE,
        startDate: new Date('2024-01-13'),
        dueDate: new Date('2024-01-25'),
        estimatedHours: 32,
        actualHours: 24,
        storyPoints: 20,
        createdById: pm.id,
        assigneeId: dev1.id,
        projectId: project1.id,
        position: 3,
      },
      {
        title: 'Implement Real-time Notifications',
        description: 'WebSocket-based real-time notifications for task updates',
        status: TaskStatusEnum.IN_REVIEW,
        priority: TaskPriorityEnum.MEDIUM,
        issueType: TaskIssueTypeEnum.FEATURE,
        startDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-05'),
        estimatedHours: 24,
        actualHours: 20,
        storyPoints: 16,
        createdById: pm.id,
        assigneeId: dev2.id,
        projectId: project1.id,
        position: 4,
      },
      {
        title: 'Fix Login Form Validation',
        description:
          'Login form accepts invalid email formats and shows unclear error messages',
        status: TaskStatusEnum.TODO,
        priority: TaskPriorityEnum.URGENT,
        issueType: TaskIssueTypeEnum.BUG,
        startDate: new Date('2024-01-22'),
        dueDate: new Date('2024-01-24'),
        estimatedHours: 4,
        actualHours: 0,
        storyPoints: 3,
        createdById: admin.id,
        assigneeId: dev1.id,
        projectId: project1.id,
        position: 5,
      },
      {
        title: 'Mobile App UI Design',
        description: 'Design user interface for iOS and Android applications',
        status: TaskStatusEnum.BACKLOG,
        priority: TaskPriorityEnum.MEDIUM,
        issueType: TaskIssueTypeEnum.FEATURE,
        startDate: new Date('2024-02-01'),
        dueDate: new Date('2024-02-15'),
        estimatedHours: 40,
        actualHours: 0,
        storyPoints: 25,
        createdById: pm.id,
        assigneeId: null,
        projectId: project2.id,
        position: 1,
      },
      {
        title: 'Implement Push Notifications',
        description: 'Add push notification support for mobile applications',
        status: TaskStatusEnum.BACKLOG,
        priority: TaskPriorityEnum.LOW,
        issueType: TaskIssueTypeEnum.FEATURE,
        startDate: new Date('2024-03-01'),
        dueDate: new Date('2024-03-15'),
        estimatedHours: 28,
        actualHours: 0,
        storyPoints: 18,
        createdById: pm.id,
        assigneeId: null,
        projectId: project2.id,
        position: 2,
      },
      {
        title: 'Optimize Database Queries',
        description:
          'Improve application performance by optimizing slow database queries',
        status: TaskStatusEnum.BACKLOG,
        priority: TaskPriorityEnum.MEDIUM,
        issueType: TaskIssueTypeEnum.IMPROVEMENT,
        startDate: new Date('2024-02-10'),
        dueDate: new Date('2024-02-20'),
        estimatedHours: 16,
        actualHours: 0,
        storyPoints: 10,
        createdById: admin.id,
        assigneeId: dev1.id,
        projectId: project1.id,
        position: 6,
      },
    ];

    for (const taskData of tasks) {
      const existingTask = await this.taskRepository.findOne({
        where: { title: taskData.title },
      });

      if (!existingTask) {
        const task = this.taskRepository.create(taskData);
        await this.taskRepository.save(task);
        console.log(`Created task: ${taskData.title}`);
      } else {
        console.log(`Task already exists: ${taskData.title}`);
      }
    }

    console.log('Tasks seeded successfully!');
  }
}
