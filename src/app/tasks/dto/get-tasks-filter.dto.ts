import { TaskStatusEnum } from '../enum/tasks-status.enum';
import { IsNotEmpty, IsOptional, IsEnum, IsIn } from 'class-validator';

export class GetTasksFilterDto {
  @IsOptional()
  @IsIn([TaskStatusEnum.DONE, TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.DONE])
  status: TaskStatusEnum;

  @IsNotEmpty()
  @IsOptional()
  search: string;
}
