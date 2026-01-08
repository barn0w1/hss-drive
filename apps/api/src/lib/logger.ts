import { pino } from 'pino';
import { pinoLogger as honoPinoLogger } from 'hono-pino';

// Define log level based on environment
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Configure Pino instance
export const logger = pino({
  level,
  transport: process.env.NODE_ENV !== 'production' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          // Ignore verbose fields in dev
          ignore: 'pid,hostname,req.headers,res.headers', 
        }
      } 
    : undefined, // Use default JSON format in production
});

// Middleware factory for Hono
export const pinoLogger = () => honoPinoLogger({
  pino: logger,
  http: {
    // Add request ID to logs if Hono has it (requestId middleware required before this)
    reqId: () => crypto.randomUUID(), 
  }
});
