import express from 'express';
import { apiRouter } from '../server/api';

const app = express();

// Setup express parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (supports both /api/health and /health)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', environment: 'vercel', time: new Date().toISOString() });
});

// API routes - Mount to both /api and / to support both Vercel serverless routing and standalone Express styles
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
