const {
    DataSource
} = require('typeorm');
require('dotenv').config();

module.exports = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
        'dist/**/*.entity{.ts,.js}',
        'src/**/*.entity{.ts,.js}'
    ],
    migrations: [
        'dist/database/migrations/*{.ts,.js}',
        'src/database/migrations/*{.ts,.js}'
    ],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    dropSchema: false,
    migrationsRun: false,
});