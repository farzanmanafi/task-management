import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  Unique,
  OneToMany,
} from 'typeorm';
import { classToPlain, Exclude } from 'class-transformer';

import { UserGenderEnum } from '../enum/user-gender.enum';
import * as bcrypt from 'bcrypt';
import { Task } from 'src/app/tasks/entities/task.entity';
import { Project } from 'src/app/projects/entities/project.entity';

@Entity()
@Unique(['username', 'email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 50 })
  firstname: string;

  @Column({ length: 50 })
  lastname: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  salt: string;

  @Column({ type: 'date' })
  birthday: Date;

  @Column('enum', {
    enum: UserGenderEnum,
  })
  gender: UserGenderEnum;

  @Column()
  phoneNumber: string;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany((type) => Task, (task) => task.user, { eager: true })
  tasks: Task[];

  @OneToMany((type) => Project, (project) => project.user, { eager: true })
  projects: Project[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
