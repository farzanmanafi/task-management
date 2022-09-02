import { Repository, EntityRepository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectFilterDto } from './dto/get-project-filter.dto';

import { ProjectStatusEnum } from './enum/project-status.enum';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../auth/entities/user.entitty';
import { Logger, InternalServerErrorException } from '@nestjs/common';

@EntityRepository(Project)
export class ProjectRepository extends Repository<Project> {
  private logger = new Logger('ProjectRepository');

  async createProject(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    try {
      const { name, description, status, startDate, endDate } =
        createProjectDto;
      const project = new Project();
      project.description = description;
      project.name = name;
      project.status = ProjectStatusEnum.DONE;
      project.startDate = startDate;
      project.endDate = endDate;
      project.user;
      await project.save();

      delete project.user;
      return project;
    } catch (error) {
      this.logger.error(
        `Failed to create a project for user "${
          user.username
        }"., Data: ${JSON.stringify(createProjectDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getProjects(filterDto: GetProjectFilterDto, user: User): Promise<any> {
    try {
      const { search } = filterDto;
      const query = this.createQueryBuilder('project');

      query.where('project.userId = :userId', { userId: user.id });
      if (search) {
        query.andWhere(
          '(project.name LIKE :search OR project.description LIKE :search)',
          { search: `%${search}%` },
        );
      }

      const projects = await query.getMany();

      return projects;
    } catch (error) {
      this.logger.error(
        `Failed to get Projects for user "${
          user.username
        }"., Filters: ${JSON.stringify(filterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
