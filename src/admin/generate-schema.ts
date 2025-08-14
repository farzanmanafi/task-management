// src/admin/generate-schema.ts
import { config } from 'dotenv';

// Load environment variables
config();

async function generateForestSchema() {
  try {
    // Import Forest Admin packages
    const { createAgent } = await import('@forestadmin/agent');
    const { createSqlDataSource } = await import('@forestadmin/datasource-sql');

    // Build PostgreSQL connection URL
    const dbUrl = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE}`;

    console.log('Connecting to database...');

    // Create Forest Admin agent
    const agent = createAgent({
      authSecret: process.env.FOREST_AUTH_SECRET || 'development-secret',
      envSecret: process.env.FOREST_ENV_SECRET || 'development-env-secret',
      isProduction: false, // Force development mode to generate schema
      schemaPath: './forestadmin-schema.json',
    });

    // Add SQL datasource
    agent.addDataSource(
      createSqlDataSource(dbUrl, {
        liveQueryConnections: 'main_database',
      }),
    );

    console.log('Database connected successfully');

    // In the new Forest Admin API, the schema is automatically generated
    // when the agent starts in development mode. Just start the agent
    // and it will create the forestadmin-schema.json file automatically.
    console.log('Starting agent to generate schema...');

    // Start the agent which will auto-generate the schema
    await agent.start();

    console.log(
      '✅ Forest Admin schema generated automatically at ./forestadmin-schema.json',
    );
    console.log('✅ Schema generation completed successfully!');

    // Stop the agent after schema generation
    await agent.stop();

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate Forest Admin schema:', error.message);
    console.error(
      'Make sure your database is running and credentials are correct',
    );
    process.exit(1);
  }
}

generateForestSchema();
