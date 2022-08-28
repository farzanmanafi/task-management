import { IsNotEmpty, Matches, IsEnum } from 'class-validator';
import { dateRegex } from 'src/shared/helper';
import { ProjectStatusEnum } from '../enum/project-status.enum';
const util = require('util');
export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsEnum(ProjectStatusEnum)
  status: ProjectStatusEnum;

  @IsNotEmpty()
  @Matches(dateRegex)
  startDate: Date;

  @IsNotEmpty()
  @Matches(dateRegex)
  endDate: Date;
}
