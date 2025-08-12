// src/app/admin-pannel/admin.setup.ts
import { User } from '../auth/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Label } from '../labels/entities/label.entity';

// Try to import AdminJS adapter with error handling
let AdminJS: any, Database: any, Resource: any;

try {
  AdminJS = require('adminjs');
  const adapter = require('@adminjs/typeorm');
  Database = adapter.Database;
  Resource = adapter.Resource;

  // Register the adapter
  AdminJS.registerAdapter({ Database, Resource });
} catch (error) {
  console.warn('AdminJS packages not available');
}

export interface AdminEntities {
  User: typeof User;
  Task: typeof Task;
  Project: typeof Project;
  Label: typeof Label;
}

export function createAdminConfig(entities: AdminEntities) {
  return {
    rootPath: '/admin',
    dashboard: {},
    resources: [
      {
        resource: entities.User,
        options: {
          parent: {
            name: 'User Management',
            icon: 'User',
          },
          listProperties: [
            'id',
            'username',
            'email',
            'role',
            'isActive',
            'createdAt',
          ],
          showProperties: [
            'id',
            'username',
            'email',
            'firstName',
            'lastName',
            'role',
            'isActive',
            'isEmailVerified',
            'createdAt',
            'updatedAt',
          ],
          editProperties: [
            'username',
            'email',
            'firstName',
            'lastName',
            'role',
            'isActive',
            'isEmailVerified',
          ],
          filterProperties: ['username', 'email', 'role', 'isActive'],
          actions: {
            new: {
              before: async (request: any) => {
                if (request.method === 'post' && request.payload?.password) {
                  const bcrypt = require('bcrypt');
                  request.payload.password = await bcrypt.hash(
                    request.payload.password,
                    10,
                  );
                }
                return request;
              },
            },
            edit: {
              before: async (request: any) => {
                if (request.method === 'post' && request.payload?.password) {
                  const bcrypt = require('bcrypt');
                  request.payload.password = await bcrypt.hash(
                    request.payload.password,
                    10,
                  );
                }
                return request;
              },
            },
          },
          properties: {
            password: {
              type: 'password',
              isVisible: {
                list: false,
                show: false,
                edit: true,
                filter: false,
              },
            },
            id: {
              isVisible: {
                list: true,
                show: true,
                edit: false,
                filter: false,
              },
            },
          },
        },
      },
      {
        resource: entities.Task,
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
            'issueType',
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
            'createdById',
            'estimatedHours',
            'actualHours',
            'createdAt',
            'updatedAt',
          ],
          editProperties: [
            'title',
            'description',
            'status',
            'priority',
            'issueType',
            'assigneeId',
            'projectId',
            'estimatedHours',
            'actualHours',
            'startDate',
            'dueDate',
          ],
          filterProperties: [
            'status',
            'priority',
            'issueType',
            'assigneeId',
            'projectId',
          ],
          properties: {
            description: {
              type: 'textarea',
              props: {
                rows: 4,
              },
            },
            startDate: {
              type: 'datetime',
            },
            dueDate: {
              type: 'datetime',
            },
            completedAt: {
              type: 'datetime',
              isVisible: {
                edit: false,
                new: false,
              },
            },
          },
        },
      },
      {
        resource: entities.Project,
        options: {
          parent: {
            name: 'Project Management',
            icon: 'Folder',
          },
          listProperties: [
            'id',
            'name',
            'status',
            'userId',
            'startDate',
            'endDate',
          ],
          showProperties: [
            'id',
            'name',
            'description',
            'status',
            'userId',
            'startDate',
            'endDate',
            'createdAt',
            'updatedAt',
          ],
          editProperties: [
            'name',
            'description',
            'status',
            'userId',
            'startDate',
            'endDate',
          ],
          filterProperties: ['status', 'userId'],
          properties: {
            description: {
              type: 'textarea',
              props: {
                rows: 3,
              },
            },
            startDate: {
              type: 'date',
            },
            endDate: {
              type: 'date',
            },
          },
        },
      },
      {
        resource: entities.Label,
        options: {
          parent: {
            name: 'Configuration',
            icon: 'Tag',
          },
          listProperties: ['id', 'name', 'color'],
          showProperties: ['id', 'name', 'color', 'description', 'createdAt'],
          editProperties: ['name', 'color', 'description'],
          filterProperties: ['name'],
          properties: {
            color: {
              type: 'string',
              props: {
                type: 'color',
              },
            },
          },
        },
      },
    ],
    locale: {
      language: 'en',
      availableLanguages: ['en'],
      translations: {
        en: {
          labels: {
            loginWelcome: 'Welcome to Task Management Admin',
          },
          messages: {
            loginWelcome: 'Please sign in to continue',
          },
        },
      },
    },
    branding: {
      companyName: 'Task Management System',
      logo: false,
      favicon: '/favicon.ico',
      theme: {
        colors: {
          primary100: '#3b82f6',
          primary80: '#60a5fa',
          primary60: '#93c5fd',
          primary40: '#dbeafe',
          primary20: '#eff6ff',
          grey100: '#1f2937',
          grey80: '#374151',
          grey60: '#6b7280',
          grey40: '#9ca3af',
          grey20: '#f3f4f6',
          filterBg: '#ffffff',
          accent: '#10b981',
          hoverBg: '#f9fafb',
        },
      },
    },
  };
}
