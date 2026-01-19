import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import btcRoutes from './routes/btc.routes';
import ethRoutes from './routes/eth.routes';
import { logger } from './utils/logger';
import prisma from './config/database';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Add BigInt serialization support
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
// @ts-ignore
app.use('/api/btc', btcRoutes);
// @ts-ignore
app.use('/api/eth', ethRoutes);

// Serve frontend static files
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Handle SPA routing - return index.html for all non-API routes
// Handle SPA routing - return index.html for all non-API routes
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        next();
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'API Service',
        timestamp: new Date().toISOString(),
    });
});

// Global error handler (must be after routes)
app.use((err: any, req: any, res: any, next: any) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// Test database connection and start server
async function startServer() {
    try {
        await prisma.$connect();
        logger.info('✅ Database connection established');

        app.listen(PORT, () => {
            logger.info(`🚀 API Service running on port ${PORT}`);
            logger.info(`₿ Bitcoin API: http://localhost:${PORT}/api/btc`);
            logger.info(`⟠ Ethereum API: http://localhost:${PORT}/api/eth`);
        });
    } catch (error: any) {
        logger.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
}


startServer();
