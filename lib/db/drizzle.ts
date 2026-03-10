import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Demo mode: allow app to load without DB; use placeholder so module does not throw.
// Queries will fail at runtime if POSTGRES_URL is not set and a route uses the DB.
const connectionString =
  process.env.POSTGRES_URL || 'postgres://localhost:5432/demo?sslmode=disable';

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
