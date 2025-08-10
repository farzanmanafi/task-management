require('ts-node/register');
require('tsconfig-paths/register');
require('dotenv').config();

const {
    DataSource
} = require('typeorm');

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
        'src/app/auth/entities/user.entity.ts',
        'src/app/tasks/entities/task.entity.ts',
        'src/app/tasks/entities/task-comment.entity.ts',
        'src/app/tasks/entities/task-attachment.entity.ts',
        'src/app/tasks/entities/task-activity.entity.ts',
        'src/app/projects/entities/project.entity.ts',
        'src/app/labels/entities/label.entity.ts'
    ],
    migrations: [
        'src/database/migrations/*.ts'
    ],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: false,
});

module.exports = dataSource;