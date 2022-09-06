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
  @PrimaryGeneratedColumn()
  id: number;

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
  projectTasks: Task[];

  @ManyToOne((type) => User, (user) => user.projects, { eager: false })
  user: User;

  @Column()
  userId: number;
}
