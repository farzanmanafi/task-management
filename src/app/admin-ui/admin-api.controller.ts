// src/app/admin-ui/admin-api.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UserRoleEnum } from '../auth/enum/user-role.enum';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';
import { AdminService } from './admin.service';

@ApiTags('Admin UI API')
@Controller('api/admin-ui')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.ADMIN)
@ApiBearerAuth()
export class AdminApiController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved',
  })
  async getDashboard(@CurrentUser() user: User): Promise<ApiResponseDto<any>> {
    const stats = await this.adminService.getDashboardStats();
    const systemHealth = await this.adminService.getSystemHealth();
    const systemStats = await this.adminService.getSystemStats();

    return {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        stats,
        systemHealth,
        systemStats,
      },
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async getUsers(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('role') role?: UserRoleEnum,
  ): Promise<ApiResponseDto<any>> {
    const filters = { search, role };
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
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<User>> {
    const user = await this.adminService.getUserById(id);

    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate user' })
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<never>> {
    await this.adminService.activateUser(id);

    return {
      success: true,
      message: 'User activated successfully',
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Post('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<never>> {
    await this.adminService.deactivateUser(id);

    return {
      success: true,
      message: 'User deactivated successfully',
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks with pagination' })
  async getTasks(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<ApiResponseDto<any>> {
    const filters = { search, status };
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
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects with pagination' })
  async getProjects(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ): Promise<ApiResponseDto<any>> {
    const filters = { search };
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
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('system/stats')
  @ApiOperation({ summary: 'Get system statistics' })
  async getSystemStats(): Promise<ApiResponseDto<any>> {
    const stats = await this.adminService.getSystemStats();

    return {
      success: true,
      message: 'System statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  @Get('system/health')
  @ApiOperation({ summary: 'Get system health status' })
  async getSystemHealth(): Promise<ApiResponseDto<any>> {
    const health = await this.adminService.getSystemHealth();

    return {
      success: true,
      message: 'System health retrieved successfully',
      data: health,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }
}
