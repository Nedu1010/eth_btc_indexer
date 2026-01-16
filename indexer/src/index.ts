import './config/env'; // Load environment variables first
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { generalLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import btcCronService from './services/btc.cron';
import ethCronService from './services/eth.cron';

// Add BigInt serialization support
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
const PORT = process.env.INDEXER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiter
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        service: 'Indexer Service',
        status: 'Running',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Indexer Service running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);

    // Start cron jobs for automatic blockchain syncing
    logger.info('🔄 Starting blockchain sync cron jobs...');
    btcCronService.startCronJob();
    ethCronService.startCronJob();
});

export default app;
