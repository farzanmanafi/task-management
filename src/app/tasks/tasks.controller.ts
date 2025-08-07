import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Task } from './entities/task.entity';
import {
  ApiErrorResponseDto,
  ApiResponseDto,
  PaginatedResponseDto,
} from '@/shared/dto/api-response.dto';
import { TaskService } from './services/tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CacheInterceptor } from '@/shared/interceptors/cache.interceptor';
import { TaskPriorityEnum, TaskStatusEnum } from './enums';
import { TaskFilterDto } from './dto/task-filter.dto';
import { PaginationDto } from '@/shared/dto/pagination.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
// import { TasksService } from '../services/task.service';
// import { CreateTaskDto } from '../dto/create-task.dto';
// import { UpdateTaskDto } from '../dto/update-task.dto';
// import { TaskFilterDto } from '../dto/task-filter.dto';
// import { PaginationDto } from '../../../shared/dto/pagination.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../../auth/decorators/current-user.decorator';
// import { User } from '../../auth/entities/user.entity';
// import { Task } from '../entities/task.entity';
// import { TaskStatusEnum } from '../enums/task-status.enum';
// import { TaskPriorityEnum } from '../enums/task-priority.enum';
// import { Cache } from '../../../shared/decorators/cache.decorator';
// import { CacheInterceptor } from '../../../shared/interceptors/cache.interceptor';
// import {
//   ApiResponseDto,
//   ApiErrorResponseDto,
//   PaginatedResponseDto,
// } from '../../../shared/dto/api-response.dto';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(Task, ApiResponseDto, ApiErrorResponseDto, PaginatedResponseDto)
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TaskService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new task',
    description:
      'Creates a new task with the provided details. The authenticated user becomes the task creator.',
  })
  @ApiBody({
    type: CreateTaskDto,
    examples: {
      feature: {
        summary: 'Feature Task',
        description: 'Example of creating a feature task',
        value: {
          title: 'Implement user authentication',
          description:
            'Add JWT-based authentication system with login and registration endpoints',
          issueType: 'feature',
          priority: 'high',
          estimatedHours: 16,
          dueDate: '2024-02-01T00:00:00.000Z',
          projectId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      bug: {
        summary: 'Bug Fix',
        description: 'Example of creating a bug fix task',
        value: {
          title: 'Fix login form validation',
          description: 'Login form accepts invalid email formats',
          issueType: 'bug',
          priority: 'urgent',
          estimatedHours: 4,
          dueDate: '2024-01-15T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task created successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Task) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: ApiErrorResponseDto,
  })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const task = await this.tasksService.create(createTaskDto, user);
      return {
        success: true,
        message: 'Task created successfully',
        data: task,
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @Cache(
    'tasks:{userId}:{query.page}:{query.limit}:{query.status}:{query.priority}',
    300,
  )
  @ApiOperation({
    summary: 'Get all tasks',
    description:
      'Retrieves a paginated list of tasks with optional filtering and sorting. Results are cached for 5 minutes.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TaskStatusEnum,
    description: 'Filter by task status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: TaskPriorityEnum,
    description: 'Filter by task priority',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in task title and description',
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
    type: String,
    description: 'Filter by assignee ID',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: String,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Task) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
    type: ApiErrorResponseDto,
  })
  async findAll(
    @Query() filters: TaskFilterDto,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponseDto<Task>> {
    try {
      const { tasks, total } = await this.tasksService.findAll(
        filters,
        pagination,
        user,
      );

      const totalPages = Math.ceil(total / pagination.limit);
      const hasNext = pagination.page < totalPages;
      const hasPrevious = pagination.page > 1;

      return {
        success: true,
        message: 'Tasks retrieved successfully',
        data: tasks,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext,
          hasPrevious,
        },
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch tasks: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @Cache('task:{id}:{userId}', 300)
  @ApiOperation({
    summary: 'Get task by ID',
    description:
      'Retrieves a specific task by its ID. Results are cached for 5 minutes.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Task) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to access this task',
    type: ApiErrorResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const task = await this.tasksService.findOne(id, user);
      return {
        success: true,
        message: 'Task retrieved successfully',
        data: task,
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update task',
    description:
      'Updates a task with the provided details. Only the task creator, assignee, or admin can update the task.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateTaskDto,
    examples: {
      statusUpdate: {
        summary: 'Update Status',
        description: 'Example of updating task status',
        value: {
          status: 'in_progress',
        },
      },
      priorityUpdate: {
        summary: 'Update Priority',
        description: 'Example of updating task priority',
        value: {
          priority: 'urgent',
        },
      },
      fullUpdate: {
        summary: 'Full Update',
        description: 'Example of updating multiple fields',
        value: {
          title: 'Updated task title',
          description: 'Updated task description',
          status: 'in_review',
          priority: 'high',
          estimatedHours: 20,
          dueDate: '2024-02-15T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Task) },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to update this task',
    type: ApiErrorResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const task = await this.tasksService.update(id, updateTaskDto, user);
      return {
        success: true,
        message: 'Task updated successfully',
        data: task,
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete task',
    description:
      'Soft deletes a task. Only the task creator, project manager, or admin can delete the task.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Task deleted successfully' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to delete this task',
    type: ApiErrorResponseDto,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Omit<ApiResponseDto<never>, 'data'>> {
    try {
      await this.tasksService.remove(id, user);
      return {
        success: true,
        message: 'Task deleted successfully',
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update task status',
    description:
      'Updates the status of a specific task. This is a convenient endpoint for status-only updates.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(TaskStatusEnum),
          description: 'New task status',
          example: 'in_progress',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task status updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Task) },
          },
        },
      ],
    },
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TaskStatusEnum,
    @CurrentUser() user: User,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const task = await this.tasksService.updateStatus(id, status, user);
      return {
        success: true,
        message: 'Task status updated successfully',
        data: task,
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update task status ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload task attachment',
    description:
      'Uploads a file attachment to a task. Supports various file types with size limits.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'File uploaded successfully' },
        data: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            fileName: { type: 'string', example: 'document.pdf' },
            originalName: { type: 'string', example: 'My Document.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' },
            size: { type: 'number', example: 1024000 },
            url: {
              type: 'string',
              example:
                '/uploads/tasks/123e4567-e89b-12d3-a456-426614174000/document.pdf',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file too large',
    type: ApiErrorResponseDto,
  })
  async uploadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    try {
      // This would be implemented in the TasksService
      // const attachment = await this.tasksService.uploadAttachment(id, file, user);
      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: 'attachment-id',
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/tasks/${id}/${file.filename}`,
        },
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file for task ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':id/stats')
  @UseInterceptors(CacheInterceptor)
  @Cache('task_stats:{id}:{userId}', 600)
  @ApiOperation({
    summary: 'Get task statistics',
    description:
      'Retrieves detailed statistics for a specific task including time tracking, progress, and activity metrics.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Task ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Task statistics retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            timeSpent: { type: 'number', example: 12.5 },
            estimatedHours: { type: 'number', example: 16 },
            progressPercentage: { type: 'number', example: 78.125 },
            isOverdue: { type: 'boolean', example: false },
            daysUntilDue: { type: 'number', example: 5 },
            commentCount: { type: 'number', example: 8 },
            attachmentCount: { type: 'number', example: 3 },
            activityCount: { type: 'number', example: 25 },
            lastActivity: {
              type: 'string',
              example: '2024-01-01T10:30:00.000Z',
            },
          },
        },
      },
    },
  })
  async getTaskStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    try {
      // This would be implemented in the TasksService
      // const stats = await this.tasksService.getTaskStats(id, user);
      return {
        success: true,
        message: 'Task statistics retrieved successfully',
        data: {
          timeSpent: 12.5,
          estimatedHours: 16,
          progressPercentage: 78.125,
          isOverdue: false,
          daysUntilDue: 5,
          commentCount: 8,
          attachmentCount: 3,
          activityCount: 25,
          lastActivity: '2024-01-01T10:30:00.000Z',
        },
        timestamp: new Date().toISOString(),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get task stats ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
