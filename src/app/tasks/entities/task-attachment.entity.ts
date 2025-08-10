import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
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
  @IsNotEmpty({ message: 'File name is required' })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty({ message: 'Original name is required' })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty({ message: 'MIME type is required' })
  mimeType: string;

  @Column({ type: 'bigint' })
  @IsNumber({}, { message: 'Size must be a number' })
  @Min(0, { message: 'Size must be positive' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  @IsNotEmpty({ message: 'URL is required' })
  url: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Task, (task) => task.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, (user) => user.uploadedAttachments, {
    lazy: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: Promise<User>;

  // Computed properties
  get isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  get isDocument(): boolean {
    return (
      this.mimeType.includes('pdf') ||
      this.mimeType.includes('document') ||
      this.mimeType.includes('word') ||
      this.mimeType.includes('excel') ||
      this.mimeType.includes('spreadsheet')
    );
  }

  get sizeInMB(): number {
    return this.size / (1024 * 1024);
  }

  get fileExtension(): string {
    return this.originalName.split('.').pop()?.toLowerCase() || '';
  }
}
