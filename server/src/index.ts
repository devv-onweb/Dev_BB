import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import donationRoutes from './routes/donation.routes.js';
import requestRoutes from './routes/request.routes.js';
import compatibilityRoutes from './routes/compatibility.routes.js';
import eligibilityRoutes from './routes/eligibility.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import geoRoutes from './routes/geo.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import emergencyRoutes from './routes/emergency.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import predictionRoutes from './routes/prediction.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/donors', eligibilityRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api', geoRoutes);
app.use('/api', recommendationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check route
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'success',
      message: 'Blood Bank API Server is healthy and connected to PostgreSQL database!',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Blood Bank API Server running on http://localhost:${PORT}`);
  console.log(`🔒 Endpoints active:`);
  console.log(`   - Auth:          http://localhost:${PORT}/api/auth`);
  console.log(`   - Inventory:     http://localhost:${PORT}/api/inventory`);
  console.log(`   - Donations:     http://localhost:${PORT}/api/donations`);
  console.log(`   - Requests:      http://localhost:${PORT}/api/requests`);
  console.log(`   - Compatibility: http://localhost:${PORT}/api/compatibility`);
  console.log(`   - Donors:        http://localhost:${PORT}/api/donors`);
  console.log(`   - Hospitals:     http://localhost:${PORT}/api/hospitals`);
});

export default app;
