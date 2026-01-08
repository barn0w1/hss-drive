import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@hss/shared';
import dotenv from 'dotenv';

dotenv.config();

// Use Pool for better connection management in web server context
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
