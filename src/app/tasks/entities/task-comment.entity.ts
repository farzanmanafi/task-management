import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Task } from './task.entity';

@Entity('task_comments')
@Index(['taskId'])
@Index(['authorId'])
@Index(['createdAt'])
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Task, (task) => task.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, {
    lazy: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorId' })
  author: Promise<User>;
}
