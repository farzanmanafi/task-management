import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Task } from './task.entity';

export enum TaskActivityTypeEnum {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMMENT_ADDED = 'comment_added',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  BLOCKED = 'blocked',
  UNBLOCKED = 'unblocked',
  ARCHIVED = 'archived',
  UNARCHIVED = 'unarchived',
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
  type: TaskActivityTypeEnum;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

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
}
