import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsEmail,
  IsMobilePhone,
} from 'class-validator';
import { UserGenderEnum } from '../enum/user-gender.enum';
import { dateRegex } from 'src/shared/helper';
import { UserTypeEnum } from '../enum/user-role-enum';

export class AuthCredentialsDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsOptional()
  @IsEnum(UserTypeEnum)
  role: UserTypeEnum;

  @IsString()
  @MinLength(3)
  firstname: string;

  @IsString()
  @MinLength(3)
  lastname: string;

  @IsOptional()
  @Matches(dateRegex)
  birthday?: Date;

  @IsOptional()
  @IsEnum(UserGenderEnum)
  gender: UserGenderEnum;

  @IsMobilePhone()
  @IsNotEmpty()
  phoneNumber: string;
}
