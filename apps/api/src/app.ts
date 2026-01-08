import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './modules/auth/auth.guard.js';
import authRoutes from './modules/auth/auth.routes.js';
import storageRoutes from './modules/storage/storage.routes.js';
import spacesRoutes from './modules/spaces/spaces.routes.js';
import filesRoutes from './modules/files/files.routes.js';
import { AppBindings } from './lib/context.js';
import { pinoLogger } from './lib/logger.js';
import { requestId } from 'hono/request-id';

export const setupApp = () => {
    const app = new Hono<AppBindings>();

    // 1. Global Middlewares
    app.use('*', requestId()); // Assign generic Request ID
    app.use('*', pinoLogger()); // Log request/response

    app.use('/*', cors({
        origin: (origin) => process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : origin, 
        credentials: true,
    }));

    app.use('*', authMiddleware);

    // 2. Routes
    app.get('/', (c) => {
        return c.json({ 
            message: 'HSS Drive API Ready',
            user: c.var.user ? c.var.user.username : 'Guest'
        });
    });

    app.route('/auth', authRoutes);
    app.route('/spaces', spacesRoutes);
    app.route('/', filesRoutes); // Mounts /spaces/:id/files and /files/:id
    app.route('/storage', storageRoutes);

    return app;
}
