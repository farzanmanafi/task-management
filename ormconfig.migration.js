// Migration configuration (with ts-node support)
require('ts-node/register');
require('tsconfig-paths/register');
require('dotenv').config();

const {
    DataSource
} = require('typeorm');

module.exports = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: true,
});