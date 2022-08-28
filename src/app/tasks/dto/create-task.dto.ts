import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { TaskIssueTypeEnum } from '../enum/task-issue-type.enum';
import { TaskStatusEnum } from '../enum/tasks-status.enum';
import { dateRegex } from 'src/shared/helper';
export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  status: TaskStatusEnum;

  @IsNotEmpty()
  @Matches(dateRegex)
  startDate: Date;

  @IsNotEmpty()
  @Matches(dateRegex)
  endDate: Date;

  @IsOptional()
  attachment: string;

  @IsOptional()
  shareLink: string;

  @IsNotEmpty()
  issueType: TaskIssueTypeEnum;
}
