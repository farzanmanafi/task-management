import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { BaseFilterDto } from '../../../shared/dto/base-filter.dto';
import { TaskIssueTypeEnum, TaskPriorityEnum, TaskStatusEnum } from '../enums';
// import { TaskStatusEnum } from '../enum/tasks-status.enum';
// import { TaskIssueTypeEnum } from '../enum/task-issue-type.enum';
// import { TaskPriorityEnum } from '../enum/task-priority.enum';

export class TaskFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by task status',
    enum: TaskStatusEnum,
  })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by task priority',
    enum: TaskPriorityEnum,
  })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum;

  @ApiPropertyOptional({
    description: 'Filter by issue type',
    enum: TaskIssueTypeEnum,
  })
  @IsOptional()
  @IsEnum(TaskIssueTypeEnum)
  issueType?: TaskIssueTypeEnum;

  @ApiPropertyOptional({
    description: 'Filter by assignee ID',
  })
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
  })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator ID',
  })
  @IsOptional()
  @IsUUID('4')
  createdById?: string;

  @ApiPropertyOptional({
    description: 'Filter by due date from',
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by due date to',
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date from',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date to',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Filter overdue tasks',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Filter blocked tasks',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isBlocked?: boolean;

  @ApiPropertyOptional({
    description: 'Filter archived tasks',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isArchived?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by estimated hours range (min)',
  })
  @IsOptional()
  @Type(() => Number)
  estimatedHoursMin?: number;

  @ApiPropertyOptional({
    description: 'Filter by estimated hours range (max)',
  })
  @IsOptional()
  @Type(() => Number)
  estimatedHoursMax?: number;

  @ApiPropertyOptional({
    description: 'Filter by labels',
  })
  @IsOptional()
  @IsString()
  labels?: string;

  @ApiPropertyOptional({
    description: 'Include my tasks only',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  myTasks?: boolean;

  @ApiPropertyOptional({
    description: 'Include unassigned tasks',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  unassigned?: boolean;
}
