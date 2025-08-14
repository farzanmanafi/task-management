// src/admin/forest-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';

@Injectable()
export class ForestAdminService {
  private readonly logger = new Logger(ForestAdminService.name);
  private agent: any;

  constructor(private configService: ConfigService) {}

  async initialize(): Promise<void> {
    try {
      // Dynamic import to handle Forest Admin packages
      const { createAgent } = await import('@forestadmin/agent');
      const { createSqlDataSource } = await import(
        '@forestadmin/datasource-sql'
      );

      // Build PostgreSQL connection URL
      const dbUrl = this.buildDatabaseUrl();

      // Create the Forest Admin agent
      this.agent = createAgent({
        authSecret:
          this.configService.get('FOREST_AUTH_SECRET') ||
          'development-secret-key',
        envSecret:
          this.configService.get('FOREST_ENV_SECRET') ||
          'development-env-secret',
        isProduction: this.configService.get('NODE_ENV') === 'production',
        loggerLevel: 'Info',
        schemaPath: './forestadmin-schema.json', // Auto-generated in development
      });

      // Add SQL datasource (PostgreSQL)
      this.agent.addDataSource(
        createSqlDataSource(dbUrl, {
          liveQueryConnections: 'main_database',
        }),
      );

      // Customize collections (tables)
      this.customizeCollections();

      // Mount on a specific port (3310 for development)
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.agent.mountOnStandaloneServer(3310);
      }

      // Start the agent (this will auto-generate schema in development)
      await this.agent.start();

      this.logger.log('✅ Forest Admin initialized successfully');
      this.logger.log(`📊 Forest Admin available at: ${this.getForestUrl()}`);
      this.logger.log(`📁 Schema auto-generated at: ./forestadmin-schema.json`);

      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(
          '🔧 Development mode: Schema will auto-update on restart',
        );
      }
    } catch (error) {
      this.logger.warn(
        '⚠️  Forest Admin could not be initialized:',
        error.message,
      );
      this.logger.warn(
        '📦 Make sure you have the correct packages: npm install @forestadmin/agent @forestadmin/datasource-sql pg',
      );
      this.logger.warn('🔑 And check your database credentials in .env file');
    }
  }

  private buildDatabaseUrl(): string {
    const dbConfig = {
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
    };
    console.log(
      `Connecting to database at postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
    );

    return `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  }

  private customizeCollections(): void {
    try {
      // Customize Users collection
      this.agent.customizeCollection('users', (collection) => {
        // Hide sensitive fields
        collection.removeField('password');
        collection.removeField('refreshToken');
        collection.removeField('refreshTokenExpiresAt');

        // Add custom actions
        collection.addAction('Activate User', {
          scope: 'Single',
          execute: async (context, resultBuilder) => {
            const userId = context.getRecordId();
            // You can implement user activation logic here
            // Example: UPDATE users SET isActive = true WHERE id = userId
            return resultBuilder.success('User activated successfully');
          },
        });

        collection.addAction('Deactivate User', {
          scope: 'Single',
          execute: async (context, resultBuilder) => {
            const userId = context.getRecordId();
            // You can implement user deactivation logic here
            // Example: UPDATE users SET isActive = false WHERE id = userId
            return resultBuilder.success('User deactivated successfully');
          },
        });

        // Add computed fields
        collection.addField('fullName', {
          columnType: 'String',
          dependencies: ['firstName', 'lastName'],
          getValues: (records) =>
            records.map((record) => `${record.firstName} ${record.lastName}`),
        });

        // Add field validation
        collection.addFieldValidation('email', 'Present');
        collection.addFieldValidation('username', 'Present');
      });

      // Customize Tasks collection
      this.agent.customizeCollection('tasks', (collection) => {
        // Add filters
        collection.addFilter('My Tasks', {
          condition: (context) => ({
            field: 'assigneeId',
            operator: 'Equal',
            value: context.caller.id,
          }),
        });

        collection.addFilter('Overdue Tasks', {
          condition: () => ({
            aggregator: 'And',
            conditions: [
              {
                field: 'dueDate',
                operator: 'LessThan',
                value: new Date().toISOString(),
              },
              {
                field: 'status',
                operator: 'NotEqual',
                value: 'done',
              },
            ],
          }),
        });

        // Add custom actions
        collection.addAction('Mark as Complete', {
          scope: 'Single',
          execute: async (context, resultBuilder) => {
            const taskId = context.getRecordId();
            // Implement task completion logic here
            // Example: UPDATE tasks SET status = 'done', completedAt = NOW() WHERE id = taskId
            return resultBuilder.success('Task marked as complete');
          },
        });

        collection.addAction('Bulk Assign Tasks', {
          scope: 'Bulk',
          form: [
            {
              label: 'Assignee',
              type: 'Collection',
              collectionName: 'users',
            },
          ],
          execute: async (context, resultBuilder) => {
            const taskIds = context.getRecordIds();
            const assigneeId = context.getFormValues().assignee;
            // Implement bulk assignment logic here
            // Example: UPDATE tasks SET assigneeId = assigneeId WHERE id IN (taskIds)
            return resultBuilder.success(
              `${taskIds.length} tasks assigned successfully`,
            );
          },
        });

        // Add computed fields
        collection.addField('isOverdue', {
          columnType: 'Boolean',
          dependencies: ['dueDate', 'status'],
          getValues: (records) =>
            records.map((record) => {
              if (!record.dueDate || record.status === 'done') return false;
              return new Date(record.dueDate) < new Date();
            }),
        });

        collection.addField('progressPercentage', {
          columnType: 'Number',
          dependencies: ['estimatedHours', 'actualHours'],
          getValues: (records) =>
            records.map((record) => {
              if (!record.estimatedHours || record.estimatedHours === 0)
                return 0;
              return Math.min(
                100,
                (record.actualHours / record.estimatedHours) * 100,
              );
            }),
        });
      });

      // Customize Projects collection
      this.agent.customizeCollection('projects', (collection) => {
        collection.addAction('Generate Project Report', {
          scope: 'Single',
          execute: async (context, resultBuilder) => {
            const projectId = context.getRecordId();
            // Implement report generation logic here
            return resultBuilder.success(
              'Project report generated successfully',
            );
          },
        });

        // Add hooks
        collection.addHook('Before', 'Create', async (context) => {
          // Set default values or validate data before creating a project
          const data = context.getData();
          if (!data.startDate) {
            data.startDate = new Date();
          }
        });
      });

      // Customize Task Comments collection
      this.agent.customizeCollection('task_comments', (collection) => {
        // Hide edit action for comments older than 24 hours
        collection.addHook('Before', 'Update', async (context) => {
          const comment = await context.getRecord(['createdAt']);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          if (new Date(comment.createdAt) < dayAgo) {
            throw new Error('Cannot edit comments older than 24 hours');
          }
        });
      });

      this.logger.log('Forest Admin collections customized');
    } catch (error) {
      this.logger.error('Failed to customize Forest Admin collections:', error);
    }
  }

  private getForestUrl(): string {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    return isProduction
      ? 'https://app.forestadmin.com'
      : 'http://localhost:3310';
  }

  async stop(): Promise<void> {
    if (this.agent) {
      await this.agent.stop();
      this.logger.log('Forest Admin stopped');
    }
  }
}
