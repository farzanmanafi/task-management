import { Repository, EntityRepository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(createUserDto: CreateUserDto): Promise<void> {
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      gender,
      phoneNumber,
      birthDate,
    } = createUserDto;

    const user = this.create({
      username,
      email,
      firstName,
      lastName,
      gender,
      phoneNumber,
      birthDate: birthDate ? new Date(birthDate) : null,
    });

    user.password = password;

    try {
      await this.save(user);
    } catch (error) {
      if (error.code === '23505') {
        if (error.detail?.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(
    usernameOrEmail: string,
    password: string,
  ): Promise<string | null> {
    const user = await this.findOne({ 
      where: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });

    if (user && (await user.validatePassword(password))) {
      return user.username;
    }
    return null;
  }
}
