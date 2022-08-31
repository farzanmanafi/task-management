import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { GetProjectFilterDto } from './dto/get-project-filter.dto';
import { Project } from './entities/project.entity';
import { GetUser } from '../auth/decorator/get-user.dec';
import { User } from '../auth/entities/user.entitty';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() user: User,
  ): Promise<Project> {
    return this.projectsService.createProject(createProjectDto, user);
  }

  @Get()
  findAll(
    filterDto: GetProjectFilterDto,
    @GetUser() user: User,
  ): Promise<Project[]> {
    return this.projectsService.getProjects(filterDto, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<Project> {
    return this.projectsService.getProjectById(+id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() user: User,
  ): Promise<Project> {
    return this.projectsService.updateProject(+id, updateProjectDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, user): Promise<void> {
    return this.projectsService.deleteProject(+id, user);
  }
}
