// src/app/admin/admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UserRoleEnum } from '../auth/enum/user-role.enum';
import { AdminService } from './admin.service';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getDashboard(@CurrentUser() user: User, @Res() res: Response) {
    try {
      const stats = await this.adminService.getDashboardStats();

      // Return JSON for API or render template for web
      if (res.req.headers.accept?.includes('application/json')) {
        return res.json({
          success: true,
          message: 'Admin dashboard data retrieved',
          data: stats,
        });
      }

      // For web interface, you could render an HTML template
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Admin panel accessible',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          stats,
          panels: [
            { name: 'Users', path: '/admin/users', icon: 'users' },
            { name: 'Tasks', path: '/admin/tasks', icon: 'tasks' },
            { name: 'Projects', path: '/admin/projects', icon: 'projects' },
            { name: 'System', path: '/admin/system', icon: 'settings' },
          ],
        },
      });
    } catch (error) {
      this.logger.error('Admin dashboard error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to load admin dashboard',
      });
    }
  }

  @Get('users')
  async getUsers(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('role') role?: UserRoleEnum,
  ) {
    // Create a proper filter object
    const filters = {
      search,
      role,
    };

    const { users, total } = await this.adminService.getUsers(
      pagination,
      filters,
    );

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  @Get('users/:id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.adminService.getUserById(id);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Post('users/:id/activate')
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.activateUser(id);
    return {
      success: true,
      message: 'User activated successfully',
    };
  }

  @Post('users/:id/deactivate')
  async deactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminService.deactivateUser(id);
    return {
      success: true,
      message: 'User deactivated successfully',
    };
  }

  @Get('tasks')
  async getTasks(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    // Create a proper filter object
    const filters = {
      search,
      status,
    };

    const { tasks, total } = await this.adminService.getTasks(
      pagination,
      filters,
    );

    return {
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  @Get('projects')
  async getProjects(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    // Create a proper filter object
    const filters = {
      search,
    };

    const { projects, total } = await this.adminService.getProjects(
      pagination,
      filters,
    );

    return {
      success: true,
      message: 'Projects retrieved successfully',
      data: projects,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  @Get('system/stats')
  async getSystemStats() {
    const stats = await this.adminService.getSystemStats();
    return {
      success: true,
      message: 'System statistics retrieved',
      data: stats,
    };
  }

  @Get('system/health')
  async getSystemHealth() {
    const health = await this.adminService.getSystemHealth();
    return {
      success: true,
      message: 'System health retrieved',
      data: health,
    };
  }
}
