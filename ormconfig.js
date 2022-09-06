require('dotenv').config();

module.exports = {
    name: 'default',
    type: dbConfig.type,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['dist/**/*.entity{ .ts,.js}'],
    synchronize: true,
    // migrations: ['dist/db/migrations/*{.ts,.js}'],
    // migrationsTableName: 'migrations',
    // migrationsRun: false,
    // cli: {
    //     migrationsDir: 'src/db/migrations',
    // },
};