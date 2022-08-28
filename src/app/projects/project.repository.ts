import { Repository, EntityRepository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectFilterDto } from './dto/get-project-filter.dto';

import { ProjectStatusEnum } from './enum/project-status.enum';
import { UpdateProjectDto } from './dto/update-project.dto';

@EntityRepository(Project)
export class ProjectRepository extends Repository<Project> {
  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const { name, description, status, startDate, endDate } = createProjectDto;
    const project = new Project();
    project.description = description;
    project.name = name;
    project.status = ProjectStatusEnum.DONE;
    project.startDate = startDate;
    project.endDate = endDate;
    await project.save();

    return project;
  }

  async getProjects(filterDto: GetProjectFilterDto): Promise<any> {
    const { search } = filterDto;
    const query = this.createQueryBuilder('project');

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
