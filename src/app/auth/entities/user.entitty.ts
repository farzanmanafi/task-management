import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  Unique,
} from 'typeorm';
import { classToPlain, Exclude } from 'class-transformer';

import { UserGenderEnum } from '../enum/user-gender.enum';

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

  @Column({ length: 20 })
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
}
