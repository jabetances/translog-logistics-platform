import 'reflect-metadata';
import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { ShipmentEvent } from './shipments/entities/shipment-event.entity.js';
import { Shipment } from './shipments/entities/shipment.entity.js';
import { User } from './users/user.entity.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'translog',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'translog',
  schema: process.env.DB_SCHEMA ?? 'public',
  entities: [User, Shipment, ShipmentEvent],
  migrations: [join(currentDirectory, 'migrations', '*.js')],
  synchronize: false,
  logging: false,
});
