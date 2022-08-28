import {
  BaseEntity,
  ManyToMany,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from 'src/app/tasks/entities/task.entity';

export class Label extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Task, (task) => task.taskLabels)
  label!: Task;
}
