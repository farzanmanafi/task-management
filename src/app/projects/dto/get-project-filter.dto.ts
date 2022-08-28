import { IsNotEmpty, IsOptional, IsEnum, IsIn } from 'class-validator';

export class GetProjectFilterDto {
  @IsNotEmpty()
  @IsOptional()
  search: string;
}
