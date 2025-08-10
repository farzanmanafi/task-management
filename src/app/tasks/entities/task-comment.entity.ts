import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeUpdate,
} from 'typeorm';
import { IsNotEmpty, MaxLength } from 'class-validator';
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
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
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

  // Relationships
  @ManyToOne(() => Task, (task) => task.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, (user) => user.taskComments, {
    lazy: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authorId' })
  author: Promise<User>;

  // Lifecycle hooks
  @BeforeUpdate()
  markAsEdited(): void {
    this.isEdited = true;
  }

  // Methods
  edit(newContent: string): void {
    if (newContent !== this.content) {
      this.content = newContent;
      this.isEdited = true;
    }
  }
}
