import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';

//RDS stand for relational database service, it is a service in AWS and it is used as a database for production

const dbConfig = config.get('db');
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: dbConfig.type,
  host: process.env.RDS_HOSTNAME || dbConfig.host,
  port: process.env.RDS_PORT || dbConfig.port,
  username: process.env.RDS_USERNAME || dbConfig.username,
  password: process.env.RDS_PASSWORD || dbConfig.password,
  database: process.env.RDS_DATABASE || dbConfig.database,
  entities: [__dirname + '/../**/*.entity.ts'],
  synchronize: process.env.RDS_TYPEORM_SYNC || dbConfig.synchronize,
};
