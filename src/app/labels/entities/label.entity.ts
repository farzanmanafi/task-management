import {
  BaseEntity,
  ManyToMany,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
} from 'typeorm';
import { Task } from 'src/app/tasks/entities/task.entity';

@Entity()
export class Label extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Task, (task) => task.labels)
  task: Task;
}
