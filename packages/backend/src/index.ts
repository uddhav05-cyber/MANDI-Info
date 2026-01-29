import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, closePool } from './config/database';
import { createAuthRouter } from './routes/auth.routes';
import { createTranslationRouter } from './routes/translation.routes';
import qrRoutes from './routes/qr.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
    });
  }
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
