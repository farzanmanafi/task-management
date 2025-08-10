// Runtime configuration (simpler)
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
    entities: ['dist/**/*.entity.js'],
    synchronize: false,
    logging: false,
});