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

export class AuthCredentialsDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*d)[A-Za-zd]{8,}$/, {
    message: 'Password is too week!',
  }) // Minimum eight characters, at least one letter and one number
  password: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsString()
  @MinLength(3)
  firstname: string;

  @IsString()
  @MinLength(3)
  lastname: string;

  @IsOptional()
  @Matches(dateRegex)
  birthday?: Date;

  @IsNotEmpty()
  @IsEnum(UserGenderEnum)
  gender: UserGenderEnum;

  @IsMobilePhone()
  @IsNotEmpty()
  phoneNumber: string;
}
