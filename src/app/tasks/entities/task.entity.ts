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
}
