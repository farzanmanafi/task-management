import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectRepository } from './project.repository';
import { GetProjectFilterDto } from './dto/get-project-filter.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectRepository)
    private projectRepository: ProjectRepository,
  ) {}

  createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectRepository.createProject(createProjectDto);
  }

  getProjects(filterDto: GetProjectFilterDto): Promise<Project[]> {
    return this.projectRepository.getProjects(filterDto);
  }

  getProjectById(id: number): Promise<Project> {
    const found = this.projectRepository.findOneById(+id);
    if (!found)
      throw new NotFoundException(`Project with ID: ${id} not found!`);
    return found;
  }

  async updateProject(id: number, updateProjectDto: UpdateProjectDto) {
    const { name, description, status, startDate, endDate } = updateProjectDto;
    const project = await this.getProjectById(id);
    project.description = description;
    project.status = status;
    project.name = name;
    project.startDate = startDate;
    project.endDate = endDate;
    await project.save();
    return project;
  }

  async deleteProject(id: number) {
    const found = await this.getProjectById(id);
    if (found) await this.projectRepository.delete(id);
  }
}
