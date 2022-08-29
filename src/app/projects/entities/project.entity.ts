import { BaseEntity, Column, OneToMany } from 'typeorm';
import { Task } from 'src/app/tasks/entities/task.entity';
import { ProjectStatusEnum } from '../enum/project-status.enum';

export class Project extends BaseEntity {
  @Column()
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
}
