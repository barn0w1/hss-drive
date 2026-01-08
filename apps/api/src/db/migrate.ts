import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';

// This function will be called on server startup
export async function runMigrations() {
  console.log('Running migrations...');
  try {
    // This will run migrations from the 'drizzle' folder
    // Note: depends on where output is relative to execution
    // In production (Docker), we copy drizzle folder to /app/drizzle, and run from /app
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1); 
  }
}
