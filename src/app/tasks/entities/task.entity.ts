import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TaskStatusEnum } from '../enum/tasks-status.enum';
import { TaskIssueTypeEnum } from '../enum/task-issue-type.enum';
import { Project } from 'src/app/projects/entities/project.entity';
import { Label } from 'src/app/labels/entities/label.entity';
import { User } from 'src/app/auth/entities/user.entitty';

@Entity()
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: TaskStatusEnum;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column()
  attachment: string;

  @Column()
  shareLink: string;

  @Column('enum', {
    enum: TaskIssueTypeEnum,
    default: TaskIssueTypeEnum.FEATURE,
  })
  issueType: TaskIssueTypeEnum;

  @ManyToOne(() => Project, (project) => project.projectTasks)
  project!: Project;

  @OneToMany(() => Label, (task) => task.label)
  taskLabels: Label[];

  @ManyToOne((type) => User, (user) => user.tasks, { eager: false })
  user: User;

  @Column()
  userId: number;
}
