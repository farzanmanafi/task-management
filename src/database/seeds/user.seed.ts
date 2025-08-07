// src/database/seeds/user.seed.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../app/auth/entities/user.entity';
import { UserRoleEnum } from '../../app/auth/enum/user-role.enum';
import { UserGenderEnum } from '../../app/auth/enum/user-gender.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding users...');

    const users = [
      {
        email: 'admin@taskmanagement.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        password: await bcrypt.hash('Admin123!', 10),
        role: UserRoleEnum.ADMIN,
        gender: UserGenderEnum.PREFER_NOT_TO_SAY,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'pm@taskmanagement.com',
        username: 'projectmanager',
        firstName: 'Project',
        lastName: 'Manager',
        password: await bcrypt.hash('PM123!', 10),
        role: UserRoleEnum.PROJECT_MANAGER,
        gender: UserGenderEnum.MALE,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'dev1@taskmanagement.com',
        username: 'developer1',
        firstName: 'John',
        lastName: 'Developer',
        password: await bcrypt.hash('Dev123!', 10),
        role: UserRoleEnum.DEVELOPER,
        gender: UserGenderEnum.MALE,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'dev2@taskmanagement.com',
        username: 'developer2',
        firstName: 'Jane',
        lastName: 'Developer',
        password: await bcrypt.hash('Dev123!', 10),
        role: UserRoleEnum.DEVELOPER,
        gender: UserGenderEnum.FEMALE,
        isActive: true,
        isEmailVerified: true,
      },
      {
        email: 'client@taskmanagement.com',
        username: 'client',
        firstName: 'Client',
        lastName: 'User',
        password: await bcrypt.hash('Client123!', 10),
        role: UserRoleEnum.CLIENT,
        gender: UserGenderEnum.PREFER_NOT_TO_SAY,
        isActive: true,
        isEmailVerified: true,
      },
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = this.userRepository.create(userData);
        await this.userRepository.save(user);
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    console.log('Users seeded successfully!');
  }
}
