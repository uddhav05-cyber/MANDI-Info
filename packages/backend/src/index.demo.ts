/**
 * Demo Server - Runs without database
 * For quick testing and demonstration
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import demoRoutes from './routes/demo.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: 'demo',
    timestamp: new Date().toISOString(),
    database: 'mock',
  });
});

// Demo API Routes
app.use('/api', demoRoutes);

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 DEMO MODE - Backend server running');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`💾 Database: Mock data (no persistence)`);
  console.log(`🌐 CORS: Enabled`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/products');
  console.log('  GET  /api/products/:id');
  console.log('  GET  /api/products/:id/qr-code');
  console.log('  POST /api/whatsapp/share');
  console.log('  GET  /api/vendors');
  console.log('  GET  /api/categories');
  console.log('  GET  /api/languages');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
