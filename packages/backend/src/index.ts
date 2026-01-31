import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, closePool } from './config/database';
import { createAuthRouter } from './routes/auth.routes';
import { createTranslationRouter } from './routes/translation.routes';
import qrRoutes from './routes/qr.routes';
import { validateEnvironmentOrExit } from './config/validate-env';

dotenv.config();

// Validate environment variables on startup
validateEnvironmentOrExit();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? undefined : false,
  crossOriginEmbedderPolicy: IS_PRODUCTION ? undefined : false,
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Request logging middleware
if (!IS_PRODUCTION) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${req.headers['x-request-id']}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbConnected = await testConnection();
    const redisConnected = !!process.env.REDIS_URL; // TODO: Add actual Redis health check
    
    const status = dbConnected ? 'healthy' : 'degraded';
    const statusCode = dbConnected ? 200 : 503;
    
    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'configured' : 'not configured',
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'error',
        redis: 'unknown',
      },
    });
  }
});

// API health check (for monitoring services)
app.get('/api/health', async (req, res) => {
  return app._router.handle(req, res, () => {
    req.url = '/health';
    app._router.handle(req, res, () => {});
  });
});

// API Routes
app.use('/api/auth', createAuthRouter());
app.use('/api', createTranslationRouter());
app.use('/api', qrRoutes);

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Server will start but may not function properly.');
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await closePool();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await closePool();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
