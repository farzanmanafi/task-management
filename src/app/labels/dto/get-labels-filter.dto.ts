import { IsNotEmpty } from 'class-validator';

export class GetLabelFilterDto {
  @IsNotEmpty()
  search: string;
}
