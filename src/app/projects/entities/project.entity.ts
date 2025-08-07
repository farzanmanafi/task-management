import {
  BaseEntity,
  Column,
  OneToMany,
  ManyToOne,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from 'src/app/tasks/entities/task.entity';
import { ProjectStatusEnum } from '../enum/project-status.enum';
import { User } from 'src/app/auth/entities/user.entity';

@Entity()
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') // Changed to UUID
  id: string; // Changed from number to string

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('enum', {
    enum: ProjectStatusEnum,
  })
  status: ProjectStatusEnum;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];

  @ManyToOne((type) => User, (user) => user.projects, {
    cascade: true,
    eager: false,
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: User;

  @Column({ type: 'uuid' }) // Changed to UUID type
  userId: string; // Changed from number to string
}
