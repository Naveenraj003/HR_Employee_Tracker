import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'hospital_user',
  password: process.env.DB_PASSWORD || 'hospital_password',
  database: process.env.DB_NAME || 'hospital_tracker_dev',
  entities: [
    path.join(__dirname, '/modules/**/entities/*.entity{.ts,.js}'),
  ],
  migrations: [
    path.join(__dirname, '/database/migrations/*{.ts,.js}'),
  ],
  subscribers: [],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  migrationsRun: false,
  migrationsTransactionMode: 'each',
});
