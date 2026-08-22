import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import donationRoutes from './routes/donation.routes.js';
import requestRoutes from './routes/request.routes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Core Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
// Health check route
app.get('/api/health', async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'success',
            message: 'Blood Bank API Server is healthy and connected to PostgreSQL database!',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// 404 Route Handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
    });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
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
    console.log(`   - Auth:      http://localhost:${PORT}/api/auth`);
    console.log(`   - Inventory: http://localhost:${PORT}/api/inventory`);
    console.log(`   - Donations: http://localhost:${PORT}/api/donations`);
    console.log(`   - Requests:  http://localhost:${PORT}/api/requests`);
});
export default app;
