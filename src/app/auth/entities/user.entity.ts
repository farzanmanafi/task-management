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
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import * as bcrypt from 'bcrypt';

import { Task } from '../../tasks/entities/task.entity';
import { Project } from '../../projects/entities/project.entity';
import { TaskComment } from '../../tasks/entities/task-comment.entity';
import { TaskAttachment } from '../../tasks/entities/task-attachment.entity';
import { UserRoleEnum } from '../enum/user-role.enum';
import { UserGenderEnum } from '../enum/user-gender.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['role'])
@Index(['isActive'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @IsNotEmpty()
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
  birthDate?: Date;

  @Column({ type: 'enum', enum: UserGenderEnum, nullable: true })
  @IsOptional()
  @IsEnum(UserGenderEnum)
  gender?: UserGenderEnum;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  avatar?: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Exclude({ toPlainOnly: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  refreshTokenExpiresAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  deletedAt?: Date;

  // Relationships
  @OneToMany(() => Task, (task) => task.createdBy, { lazy: true })
  createdTasks: Promise<Task[]>;

  @OneToMany(() => Task, (task) => task.assignee, { lazy: true })
  assignedTasks: Promise<Task[]>;

  @OneToMany(() => Project, (project) => project.user, { lazy: true })
  projects: Promise<Project[]>;

  @OneToMany(() => TaskComment, (comment) => comment.author, { lazy: true })
  taskComments: Promise<TaskComment[]>;

  @OneToMany(() => TaskAttachment, (attachment) => attachment.uploadedBy, {
    lazy: true,
  })
  uploadedAttachments: Promise<TaskAttachment[]>;

  // Computed property
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2b$')) {
      // Only hash if not already hashed
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
    if (!this.email) {
      throw new Error('Email is required');
    }
    if (!this.username) {
      throw new Error('Username is required');
    }
    // Ensure email and username are lowercase
    this.email = this.email.toLowerCase();
    this.username = this.username.toLowerCase();
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

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
    this.clearRefreshToken();
  }

  verifyEmail(): void {
    this.isEmailVerified = true;
  }

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatar?: string;
    birthDate?: Date;
    gender?: UserGenderEnum;
  }): void {
    Object.assign(this, data);
  }
}
