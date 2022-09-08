import { ResourceWithOptions } from 'adminjs';
import { Task } from 'src/app/tasks/entities/task.entity';

export const TaskResource: ResourceWithOptions = {
  resource: Task,
  options: {
    actions: {},
  },
  features: [],
};
export default TaskResource;
