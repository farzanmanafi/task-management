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

@Entity('task_attachments')
@Index(['taskId'])
@Index(['uploadedById'])
@Index(['createdAt'])
export class TaskAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Task, (task) => task.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, {
    lazy: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: Promise<User>;
}
