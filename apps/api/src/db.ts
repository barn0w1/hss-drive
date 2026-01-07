import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@hss/shared';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

// For now we don't connect immediately to avoid crashing before DB is up
// await client.connect();

export const db = drizzle(client, { schema });
