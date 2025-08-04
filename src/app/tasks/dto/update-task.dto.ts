// import { PartialType } from '@nestjs/mapped-types';
// import { CreateTaskDto } from './create-task.dto';

// export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

// src/app/tasks/dto/update-task.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatusEnum } from '../enums/task-status.enum';
import { TaskPriorityEnum } from '../enums/task-priority.enum';
import { TaskIssueTypeEnum } from '../enums/task-issue-type.enum';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description: 'Task title',
    example: 'Updated task title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Updated task description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatusEnum,
  })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: TaskPriorityEnum,
  })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum;

  @ApiPropertyOptional({
    description: 'Task issue type',
    enum: TaskIssueTypeEnum,
  })
  @IsOptional()
  @IsEnum(TaskIssueTypeEnum)
  issueType?: TaskIssueTypeEnum;

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
    description: 'Estimated hours',
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

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
}
