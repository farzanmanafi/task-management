import { AdminJSOptions } from 'adminjs';
import { User } from '../auth/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Label } from '../labels/entities/label.entity';
import { TaskComment } from '../tasks/entities/task-comment.entity';
import { TaskAttachment } from '../tasks/entities/task-attachment.entity';
import { TaskActivity } from '../tasks/entities/task-activity.entity';

export const adminJSOptions: AdminJSOptions = {
  rootPath: '/admin',
  dashboard: {},
  resources: [
    {
      resource: User,
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
            before: async (request) => {
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
            before: async (request) => {
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
      resource: Project,
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
      resource: Label,
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
    {
      resource: TaskComment,
      options: {
        parent: {
          name: 'Task Management',
          icon: 'MessageCircle',
        },
        listProperties: ['id', 'taskId', 'authorId', 'content', 'createdAt'],
        showProperties: [
          'id',
          'taskId',
          'authorId',
          'content',
          'isEdited',
          'createdAt',
          'updatedAt',
        ],
        editProperties: ['content'],
        filterProperties: ['taskId', 'authorId'],
        properties: {
          content: {
            type: 'textarea',
            props: {
              rows: 3,
            },
          },
        },
        actions: {
          new: {
            isVisible: false, // Usually comments are created through the app
          },
          delete: {
            isVisible: true,
          },
        },
      },
    },
    {
      resource: TaskAttachment,
      options: {
        parent: {
          name: 'Task Management',
          icon: 'Paperclip',
        },
        listProperties: [
          'id',
          'taskId',
          'fileName',
          'originalName',
          'size',
          'createdAt',
        ],
        showProperties: [
          'id',
          'taskId',
          'fileName',
          'originalName',
          'mimeType',
          'size',
          'url',
          'uploadedById',
          'createdAt',
        ],
        editProperties: [], // Attachments shouldn't be editable
        filterProperties: ['taskId', 'uploadedById', 'mimeType'],
        actions: {
          new: {
            isVisible: false, // Attachments are uploaded through the app
          },
          edit: {
            isVisible: false,
          },
          delete: {
            isVisible: true,
          },
        },
      },
    },
    {
      resource: TaskActivity,
      options: {
        parent: {
          name: 'Task Management',
          icon: 'Activity',
        },
        listProperties: [
          'id',
          'taskId',
          'userId',
          'type',
          'description',
          'createdAt',
        ],
        showProperties: [
          'id',
          'taskId',
          'userId',
          'type',
          'description',
          'metadata',
          'createdAt',
        ],
        editProperties: [], // Activity logs shouldn't be editable
        filterProperties: ['taskId', 'userId', 'type'],
        actions: {
          new: {
            isVisible: false, // Activity logs are created automatically
          },
          edit: {
            isVisible: false,
          },
          delete: {
            isVisible: false, // Activity logs should be preserved
          },
        },
        properties: {
          metadata: {
            type: 'mixed',
            isVisible: {
              list: false,
              show: true,
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
