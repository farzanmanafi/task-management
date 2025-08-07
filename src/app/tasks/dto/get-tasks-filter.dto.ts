import { IsNotEmpty, IsOptional, IsEnum, IsIn } from 'class-validator';
import { TaskStatusEnum } from '../enums';

export class GetTasksFilterDto {
  @IsOptional()
  @IsIn([TaskStatusEnum.DONE, TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.DONE])
  status: TaskStatusEnum;

  @IsNotEmpty()
  @IsOptional()
  search: string;
}
