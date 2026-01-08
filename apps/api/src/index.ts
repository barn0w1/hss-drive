import { serve } from '@hono/node-server';
import { runMigrations } from './db/migrate.js';
import { setupApp } from './app.js';

const startServer = async () => {
  // Run migrations before starting server
  await runMigrations();

  const app = setupApp();

  const port = 3000;
  console.log(`Server is running on port ${port}`);

  serve({
    fetch: app.fetch,
    port
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
