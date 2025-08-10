import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { ProjectStatusEnum } from '../enum/project-status.enum';
import { User } from '../../auth/entities/user.entity';

@Entity('projects')
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatusEnum,
    default: ProjectStatusEnum.PLANNING,
  })
  status: ProjectStatusEnum;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  // Relationships
  @OneToMany(() => Task, (task) => task.project, {
    lazy: true,
    cascade: ['soft-remove'],
  })
  tasks: Promise<Task[]>;

  @ManyToOne(() => User, (user) => user.projects, {
    lazy: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Promise<User>;

  // Computed properties
  get isActive(): boolean {
    return this.status === ProjectStatusEnum.ACTIVE;
  }

  get isCompleted(): boolean {
    return this.status === ProjectStatusEnum.COMPLETED;
  }

  get duration(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Methods
  updateStatus(status: ProjectStatusEnum): void {
    this.status = status;
  }

  extendDeadline(newEndDate: Date): void {
    if (newEndDate > this.endDate) {
      this.endDate = newEndDate;
    }
  }
}
