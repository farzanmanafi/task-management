import { Repository, EntityRepository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectFilterDto } from './dto/get-project-filter.dto';

import { ProjectStatusEnum } from './enum/project-status.enum';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../auth/entities/user.entitty';

@EntityRepository(Project)
export class ProjectRepository extends Repository<Project> {
  async createProject(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    const { name, description, status, startDate, endDate } = createProjectDto;
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
  }

  async getProjects(filterDto: GetProjectFilterDto, user: User): Promise<any> {
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
  }
}
