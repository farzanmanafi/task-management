import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrderEnum } from '../enums/sort-order.enum';

export class BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Search term',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search term must not exceed 100 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum, { message: 'Sort order must be ASC or DESC' })
  sortOrder?: SortOrderEnum = SortOrderEnum.DESC;

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortField?: string = 'createdAt';
}
