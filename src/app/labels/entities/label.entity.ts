import {
  BaseEntity,
  ManyToMany,
  Column,
  PrimaryGeneratedColumn,
  Entity,
} from 'typeorm';
import { Task } from 'src/app/tasks/entities/task.entity';

@Entity()
export class Label extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Task, (task) => task.taskLabels)
  label!: Task;
}
