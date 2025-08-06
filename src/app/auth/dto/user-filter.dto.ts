import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '../../../shared/dto/base-filter.dto';
import { UserRoleEnum } from '../enum';

export class UserFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRoleEnum,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum, { message: 'Invalid user role' })
  role?: UserRoleEnum;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    default: true,
  })
  @IsOptional()
  isActive?: boolean = true;
}
