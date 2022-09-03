import { ResourceWithOptions } from 'adminjs';
import { Label } from 'src/app/labels/entities/label.entity';
import { Task } from 'src/app/tasks/entities/task.entity';

export const TaskResource: ResourceWithOptions = {
  resource: Task,
  options: {},
  features: [],
};
export default TaskResource;
