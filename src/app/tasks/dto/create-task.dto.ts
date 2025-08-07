// src/app/tasks/dto/create-task.dto.ts (Updated version)
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskIssueTypeEnum, TaskPriorityEnum, TaskStatusEnum } from '../enums';
// import { TaskStatusEnum } from '../enum/tasks-status.enum';
// import { TaskPriorityEnum } from '../enum/task-priority.enum';
// import { TaskIssueTypeEnum } from '../enum/task-issue-type.enum';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Task description',
    example:
      'Implement JWT-based authentication system with login and registration',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatusEnum,
    default: TaskStatusEnum.BACKLOG,
  })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum = TaskStatusEnum.BACKLOG;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: TaskPriorityEnum,
    default: TaskPriorityEnum.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum = TaskPriorityEnum.MEDIUM;

  @ApiProperty({
    description: 'Task issue type',
    enum: TaskIssueTypeEnum,
  })
  @IsEnum(TaskIssueTypeEnum)
  issueType: TaskIssueTypeEnum;

  @ApiPropertyOptional({
    description: 'Task start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2024-01-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Assignee user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Estimated hours',
    example: 8,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: 'Story points',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  storyPoints?: number;
}
