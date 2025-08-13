import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from '../auth/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Label } from '../labels/entities/label.entity';
import { TaskComment } from '../tasks/entities/task-comment.entity';
import { TaskAttachment } from '../tasks/entities/task-attachment.entity';
import { TaskActivity } from '../tasks/entities/task-activity.entity';

// AdminJS configuration
import { adminJSOptions } from './admin-panel.plugin';

// Dynamic import to handle potential module resolution issues
const createAdminModule = (): DynamicModule | null => {
  try {
    // Import AdminJS packages
    const { AdminModule } = require('@adminjs/nestjs');
    const AdminJS = require('adminjs');
    const { Database, Resource } = require('@adminjs/typeorm');

    // Register the adapter
    AdminJS.registerAdapter({ Database, Resource });

    return AdminModule.createAdminAsync({
      imports: [
        TypeOrmModule.forFeature([
          User,
          Task,
          Project,
          Label,
          TaskComment,
          TaskAttachment,
          TaskActivity,
        ]),
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        adminJsOptions: {
          ...adminJSOptions,
          rootPath: '/admin',
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
                properties: {
                  password: {
                    type: 'password',
                    isVisible: {
                      list: false,
                      show: false,
                      edit: false,
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
                showProperties: [
                  'id',
                  'name',
                  'color',
                  'description',
                  'createdAt',
                ],
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
                listProperties: [
                  'id',
                  'taskId',
                  'authorId',
                  'content',
                  'createdAt',
                ],
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
                    isVisible: false,
                  },
                  delete: {
                    isVisible: true,
                  },
                },
              },
            },
          ],
        },
        auth: {
          authenticate: async (email: string, password: string) => {
            const adminEmail = configService.get(
              'ADMIN_EMAIL',
              'admin@taskmanagement.com',
            );
            const adminPassword = configService.get(
              'ADMIN_PASSWORD',
              'admin123',
            );

            if (email === adminEmail && password === adminPassword) {
              return { email, title: 'Admin' };
            }
            return null;
          },
          cookieName: 'adminjs',
          cookiePassword:
            configService.get<string>('COOKIE_SECRET') ||
            'secret-key-change-in-production',
        },
        sessionOptions: {
          resave: false,
          saveUninitialized: true,
          secret:
            configService.get<string>('COOKIE_SECRET') ||
            'secret-key-change-in-production',
        },
      }),
    });
  } catch (error) {
    console.warn('AdminJS not available:', error.message);
    return null;
  }
};

@Module({})
export class AdminPannelModule {
  static forRootAsync(): DynamicModule | null {
    return createAdminModule();
  }
}
