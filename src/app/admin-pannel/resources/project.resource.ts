// src/app/admin-panel/resources/project.resource.ts - UPDATED
import { ResourceOptions } from 'adminjs';
import { Project } from '../../projects/entities/project.entity';

export const ProjectResource = {
  resource: Project,
  options: {
    parent: {
      name: 'Project Management',
      icon: 'Folder',
    },
    listProperties: ['id', 'name', 'status', 'userId', 'startDate', 'endDate'],
    showProperties: [
      'id',
      'name',
      'description',
      'status',
      'userId',
      'startDate',
      'endDate',
      'createdAt',
    ],
    editProperties: ['name', 'description', 'status', 'startDate', 'endDate'],
    filterProperties: ['status', 'userId'],
    properties: {
      description: {
        type: 'textarea',
      },
      startDate: {
        type: 'date',
      },
      endDate: {
        type: 'date',
      },
    },
  } as ResourceOptions,
};
