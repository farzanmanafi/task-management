// src/admin/simple-admin.controller.ts
import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../app/auth/guards/jwt-auth.guard';
import { RoleGuard } from '../app/auth/guards/role.guard';
import { Roles } from '../app/auth/decorators/roles.decorator';
import { UserRoleEnum } from '../app/auth/enum/user-role.enum';
import { SimpleAdminService } from './simple-admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_MANAGER)
export class SimpleAdminController {
  constructor(private adminService: SimpleAdminService) {}

  @Get()
  @Render('admin/dashboard')
  async dashboard() {
    const stats = await this.adminService.getDashboardStats();
    return { stats };
  }

  @Get('users')
  @Render('admin/users')
  async users() {
    const users = await this.adminService.getAllUsers();
    return { users };
  }

  @Get('tasks')
  @Render('admin/tasks')
  async tasks() {
    const tasks = await this.adminService.getAllTasks();
    return { tasks };
  }

  @Get('projects')
  @Render('admin/projects')
  async projects() {
    const projects = await this.adminService.getAllProjects();
    return { projects };
  }
}
