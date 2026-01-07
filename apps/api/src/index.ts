import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SHARED_MESSAGE } from '@hss/shared';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ message: 'HSS Drive API', shared: SHARED_MESSAGE });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
