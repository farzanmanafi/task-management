import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsEnum, IsOptional } from 'class-validator';
import * as bcrypt from 'bcrypt';

import { Task } from '../../tasks/entities/task.entity';
import { Project } from '../../projects/entities/project.entity';
import { UserGenderEnum } from '../enums/user-gender.enum';
import { UserRoleEnum } from '../enums/user-role.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['role'])
@Index(['isActive'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty()
  @Index()
  username: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty()
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  @IsNotEmpty()
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.USER })
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  birthDate: Date;

  @Column({ type: 'enum', enum: UserGenderEnum, nullable: true })
  @IsOptional()
  @IsEnum(UserGenderEnum)
  gender: UserGenderEnum;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  avatar: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  refreshTokenExpiresAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @OneToMany(() => Task, (task) => task.user, { lazy: true })
  tasks: Promise<Task[]>;

  @OneToMany(() => Project, (project) => project.user, { lazy: true })
  projects: Promise<Project[]>;

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  @BeforeInsert()
  setDefaultValues(): void {
    if (!this.role) {
      this.role = UserRoleEnum.USER;
    }
    if (this.isActive === undefined) {
      this.isActive = true;
    }
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  setRefreshToken(token: string, expiresAt: Date): void {
    this.refreshToken = token;
    this.refreshTokenExpiresAt = expiresAt;
  }

  clearRefreshToken(): void {
    this.refreshToken = null;
    this.refreshTokenExpiresAt = null;
  }

  isRefreshTokenValid(): boolean {
    if (!this.refreshToken || !this.refreshTokenExpiresAt) {
      return false;
    }
    return new Date() < this.refreshTokenExpiresAt;
  }
}