import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Exclude } from 'class-transformer';

import { User } from '../../auth/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Label } from '../../labels/entities/label.entity';
import { TaskComment } from './task-comment.entity';
import { TaskAttachment } from './task-attachment.entity';
import { TaskActivity } from './task-activity.entity';

import { TaskStatusEnum } from '../enums/task-status.enum';
import { TaskPriorityEnum } from '../enums/task-priority.enum';
import { TaskIssueTypeEnum } from '../enums/task-issue-type.enum';

@Entity('tasks')
@Index(['status'])
@Index(['priority'])
@Index(['assigneeId'])
@Index(['projectId'])
@Index(['createdById'])
@Index(['createdAt'])
@Index(['dueDate'])
@Index(['status', 'priority'])
@Index(['assigneeId', 'status'])
@Index(['projectId', 'status'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @IsNotEmpty()
  @Index()
  title: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatusEnum,
    default: TaskStatusEnum.BACKLOG,
  })
  @IsEnum(TaskStatusEnum)
  @Index()
  status: TaskStatusEnum;

  @Column({
    type: 'enum',
    enum: TaskPriorityEnum,
    default: TaskPriorityEnum.MEDIUM,
  })
  @IsEnum(TaskPriorityEnum)
  @Index()
  priority: TaskPriorityEnum;

  @Column({ type: 'enum', enum: TaskIssueTypeEnum })
  @IsEnum(TaskIssueTypeEnum)
  issueType: TaskIssueTypeEnum;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  completedAt: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated hours must be a number' })
  @Min(0, { message: 'Estimated hours must be positive' })
  @Max(999, { message: 'Estimated hours must not exceed 999' })
  estimatedHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber({}, { message: 'Actual hours must be a number' })
  @Min(0, { message: 'Actual hours must be positive' })
  @Max(999, { message: 'Actual hours must not exceed 999' })
  actualHours: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber({}, { message: 'Story points must be a number' })
  @Min(0, { message: 'Story points must be positive' })
  @Max(100, { message: 'Story points must not exceed 100' })
  storyPoints: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  externalId: string;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  @Index()
  position: number;

  @Column({ type: 'boolean', default: false })
  @Index()
  isBlocked: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  blockedReason: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  isArchived: boolean;

  // Foreign Keys
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @Index()
  assigneeId: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @Index()
  projectId: string;

  @Column({ type: 'uuid' })
  @Index()
  createdById: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @Index()
  parentTaskId: string;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  @Exclude()
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.assignedTasks, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigneeId' })
  assignee: Promise<User>;

  @ManyToOne(() => Project, (project) => project.tasks, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'projectId' })
  project: Promise<Project>;

  @ManyToOne(() => User, (user) => user.createdTasks, {
    lazy: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: Promise<User>;

  @ManyToOne(() => Task, (task) => task.subtasks, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask: Promise<Task>;

  @OneToMany(() => Task, (task) => task.parentTask, {
    lazy: true,
  })
  subtasks: Promise<Task[]>;

  @OneToMany(() => Label, (label) => label.task, {
    lazy: true,
    cascade: true,
  })
  labels: Promise<Label[]>;

  @OneToMany(() => TaskComment, (comment) => comment.task, {
    lazy: true,
    cascade: true,
  })
  comments: Promise<TaskComment[]>;

  @OneToMany(() => TaskAttachment, (attachment) => attachment.task, {
    lazy: true,
    cascade: true,
  })
  attachments: Promise<TaskAttachment[]>;

  @OneToMany(() => TaskActivity, (activity) => activity.task, {
    lazy: true,
    cascade: true,
  })
  activities: Promise<TaskActivity[]>;

  // Computed properties
  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== TaskStatusEnum.DONE;
  }

  get progressPercentage(): number {
    if (!this.estimatedHours || this.estimatedHours === 0) return 0;
    return Math.min(100, (this.actualHours / this.estimatedHours) * 100);
  }

  get isCompleted(): boolean {
    return this.status === TaskStatusEnum.DONE;
  }

  get timeSpent(): number {
    return this.actualHours || 0;
  }

  get timeRemaining(): number {
    if (!this.estimatedHours) return 0;
    return Math.max(0, this.estimatedHours - this.actualHours);
  }

  // Lifecycle hooks
  @BeforeInsert()
  setDefaults(): void {
    if (!this.status) {
      this.status = TaskStatusEnum.BACKLOG;
    }
    if (!this.priority) {
      this.priority = TaskPriorityEnum.MEDIUM;
    }
    if (this.actualHours === undefined) {
      this.actualHours = 0;
    }
    if (this.storyPoints === undefined) {
      this.storyPoints = 0;
    }
  }

  @BeforeUpdate()
  updateTimestamps(): void {
    if (this.status === TaskStatusEnum.DONE && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== TaskStatusEnum.DONE && this.completedAt) {
      this.completedAt = null;
    }
  }

  // Methods
  assignTo(userId: string): void {
    this.assigneeId = userId;
  }

  unassign(): void {
    this.assigneeId = null;
  }

  updateStatus(status: TaskStatusEnum): void {
    this.status = status;
    if (status === TaskStatusEnum.DONE) {
      this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }

  updatePriority(priority: TaskPriorityEnum): void {
    this.priority = priority;
  }

  addTimeSpent(hours: number): void {
    this.actualHours = (this.actualHours || 0) + hours;
  }

  setBlocked(reason: string): void {
    this.isBlocked = true;
    this.blockedReason = reason;
  }

  unblock(): void {
    this.isBlocked = false;
    this.blockedReason = null;
  }

  archive(): void {
    this.isArchived = true;
  }

  unarchive(): void {
    this.isArchived = false;
  }

  updatePosition(position: number): void {
    this.position = position;
  }

  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.metadata?.[key];
  }

  removeMetadata(key: string): void {
    if (this.metadata) {
      delete this.metadata[key];
    }
  }
}
