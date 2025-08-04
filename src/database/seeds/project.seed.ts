import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../app/projects/entities/project.entity';
import { User } from '../../app/auth/entities/user.entity';
import { ProjectStatusEnum } from 'src/app/projects/enum/project-status.enum';

@Injectable()
export class ProjectSeeder {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding projects...');

    const admin = await this.userRepository.findOne({
      where: { email: 'admin@taskmanagement.com' },
    });

    const pm = await this.userRepository.findOne({
      where: { email: 'pm@taskmanagement.com' },
    });

    if (!admin || !pm) {
      console.error(
        'Admin or PM user not found. Please run user seeder first.',
      );
      return;
    }

    const projects = [
      {
        name: 'Task Management System',
        description:
          'A comprehensive task management system with real-time collaboration features',
        status: ProjectStatusEnum.ACTIVE,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        userId: pm.id,
      },
      {
        name: 'Mobile App Development',
        description: 'Development of iOS and Android mobile applications',
        status: ProjectStatusEnum.PLANNING,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-31'),
        userId: pm.id,
      },
      {
        name: 'API Documentation',
        description: 'Complete API documentation and developer portal',
        status: ProjectStatusEnum.ACTIVE,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        userId: admin.id,
      },
      {
        name: 'Performance Optimization',
        description:
          'System performance optimization and monitoring implementation',
        status: ProjectStatusEnum.COMPLETED,
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-12-31'),
        userId: pm.id,
      },
    ];

    for (const projectData of projects) {
      const existingProject = await this.projectRepository.findOne({
        where: { name: projectData.name },
      });

      if (!existingProject) {
        const project = this.projectRepository.create(projectData);
        await this.projectRepository.save(project);
        console.log(`Created projects: ${projectData.name}`);
      } else {
        console.log(`Project already exists: ${projectData.name}`);
      }
    }

    console.log('Projects seeded successfully!');
  }
}
