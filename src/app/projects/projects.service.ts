import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectRepository } from './project.repository';
import { GetProjectFilterDto } from './dto/get-project-filter.dto';
import { Project } from './entities/project.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectRepository)
    private projectRepository: ProjectRepository,
  ) {}

  createProject(
    createProjectDto: CreateProjectDto,
    user: User,
  ): Promise<Project> {
    return this.projectRepository.createProject(createProjectDto, user);
  }

  getProjects(filterDto: GetProjectFilterDto, user: User): Promise<Project[]> {
    return this.projectRepository.getProjects(filterDto, user);
  }

  getProjectById(id: number, user: User): Promise<Project> {
    const found = this.projectRepository.findOne({
      where: { id: id.toString(), userId: user.id }, // Fixed: Convert id to string and use user.id as string
    });
    if (!found)
      throw new NotFoundException(`Project with ID: ${id} not found!`);
    return found;
  }

  async updateProject(
    id: number,
    updateProjectDto: UpdateProjectDto,
    user: User,
  ) {
    const { name, description, status, startDate, endDate } = updateProjectDto;
    const project = await this.getProjectById(id, user);

    // Update project properties
    project.description = description;
    project.status = status;
    project.name = name;
    project.startDate = startDate;
    project.endDate = endDate;
    // Note: Don't assign user directly since it's a lazy-loaded relationship
    // The userId is already set when the project was created

    // Use repository.save() instead of project.save()
    const updatedProject = await this.projectRepository.save(project);

    return updatedProject;
  }

  async deleteProject(id: number, user: User) {
    const found = await this.getProjectById(id, user);
    if (found) await this.projectRepository.delete(id.toString()); // Fixed: Convert to string
  }
}
