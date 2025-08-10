import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { User } from '../../auth/entities/user.entity';
import { Task } from './task.entity';

export enum TaskActivityTypeEnum {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMMENT_ADDED = 'comment_added',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  BLOCKED = 'blocked',
  UNBLOCKED = 'unblocked',
  ARCHIVED = 'archived',
  UNARCHIVED = 'unarchived',
  TIME_LOGGED = 'time_logged',
  DUE_DATE_CHANGED = 'due_date_changed',
  MOVED_TO_PROJECT = 'moved_to_project',
  SUBTASK_ADDED = 'subtask_added',
  SUBTASK_REMOVED = 'subtask_removed',
}

@Entity('task_activities')
@Index(['taskId'])
@Index(['userId'])
@Index(['createdAt'])
@Index(['type'])
export class TaskActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TaskActivityTypeEnum })
  @IsEnum(TaskActivityTypeEnum, { message: 'Invalid activity type' })
  type: TaskActivityTypeEnum;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Task, (task) => task.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, {
    lazy: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Promise<User>;

  // Methods
  static createActivity(
    taskId: string,
    userId: string,
    type: TaskActivityTypeEnum,
    description?: string,
    metadata?: Record<string, any>,
  ): TaskActivity {
    const activity = new TaskActivity();
    activity.taskId = taskId;
    activity.userId = userId;
    activity.type = type;
    activity.description = description;
    activity.metadata = metadata;
    return activity;
  }

  addMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.metadata?.[key];
  }
}
