import { Repository, EntityRepository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './entities/user.entitty';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

import * as bcrypt from 'bcrypt';

@EntityRepository(User)
export class UserReppsitory extends Repository<User> {
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    try {
      const {
        username,
        password,
        email,
        firstname,
        lastname,
        gender,
        phoneNumber,
        birthday,
      } = authCredentialsDto;

      const user = new User();
      user.username = username;
      user.salt = await bcrypt.genSalt();
      user.password = await this.hashPassword(password, user.salt);
      user.email = email;
      user.firstname = firstname;
      user.lastname = lastname;
      user.gender = gender;
      user.phoneNumber = phoneNumber;
      user.birthday = birthday;

      await user.save();
    } catch (error) {
      // duplicate username err
      if (error.code === '23505')
        throw new ConflictException('Username alrady exists!');
      else throw new InternalServerErrorException();
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
