// src/config/swagger.config.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AppConfigService } from './config.service';

export function setupSwagger(
  app: INestApplication,
  configService: AppConfigService,
): void {
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription(
      `
      A comprehensive task management system API built with NestJS.
      
      ## Features
      - User authentication with JWT tokens
      - Task management with priorities and statuses
      - Project management
      - File uploads and attachments
      - Real-time notifications
      - Activity tracking
      - Advanced filtering and search
      - Bulk operations
      - Analytics and reporting
      
      ## Authentication
      Most endpoints require authentication. Use the login endpoint to obtain JWT tokens.
      
      ## Rate Limiting
      API endpoints are rate-limited to prevent abuse. Default limits:
      - Authentication endpoints: 20 requests per minute
      - Other endpoints: 100 requests per minute
      
      ## Error Handling
      All API responses follow a consistent format:
      - Success: { success: true, data: {...}, message: "..." }
      - Error: { success: false, error: "...", message: "..." }
      
      ## Pagination
      List endpoints support pagination with query parameters:
      - page: Page number (default: 1)
      - limit: Items per page (default: 10, max: 100)
      
      ## Filtering and Sorting
      List endpoints support filtering and sorting:
      - Use query parameters for filtering
      - sortField: Field to sort by
      - sortOrder: ASC or DESC
    `,
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://taskmanagement.com/support',
      'support@taskmanagement.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for service-to-service authentication',
      },
      'api-key',
    )
    .addServer(
      configService.isDevelopment
        ? 'http://localhost:3000'
        : 'https://api.taskmanagement.com',
      configService.isDevelopment ? 'Development server' : 'Production server',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Tasks', 'Task management operations')
    .addTag('Projects', 'Project management operations')
    .addTag('Labels', 'Label management operations')
    .addTag('Files', 'File upload and management')
    .addTag('Analytics', 'Analytics and reporting')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Add custom CSS for better styling
  const customCss = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 20px; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .btn.authorize { background-color: #3b82f6; border-color: #3b82f6; }
    .swagger-ui .btn.authorize:hover { background-color: #1d4ed8; border-color: #1d4ed8; }
  `;

  SwaggerModule.setup('api/docs', app, document, {
    customCss,
    customSiteTitle: 'Task Management API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Create a JSON endpoint for the OpenAPI spec
  app.getHttpAdapter().get('/api/docs-json', (req, res) => {
    res.json(document);
  });
}
