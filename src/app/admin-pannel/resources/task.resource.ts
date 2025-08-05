import { ResourceOptions } from 'adminjs';
import { Task } from '../../tasks/entities/task.entity';

export const TaskResource = {
  resource: Task,
  options: {
    parent: {
      name: 'Task Management',
      icon: 'CheckSquare',
    },
    listProperties: [
      'id',
      'title',
      'status',
      'priority',
      'assigneeId',
      'createdAt',
    ],
    showProperties: [
      'id',
      'title',
      'description',
      'status',
      'priority',
      'issueType',
      'assigneeId',
      'projectId',
      'createdAt',
    ],
    editProperties: [
      'title',
      'description',
      'status',
      'priority',
      'issueType',
      'assigneeId',
      'projectId',
    ],
    filterProperties: ['status', 'priority', 'assigneeId', 'projectId'],
    properties: {
      description: {
        type: 'richtext',
      },
    },
  } as ResourceOptions,
};
