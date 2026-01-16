import { Request, Response } from 'express';
import btcService from '../services/btc.service';
import { logger } from '../utils/logger';

class BtcController {
    /**
     * Index a Bitcoin block by height
     * POST /api/btc/index/:height
     */
    async indexBlock(req: Request, res: Response) {
        try {
            const height = parseInt(req.params.height as string);

            if (isNaN(height) || height < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid block height',
                });
            }

            const block = await btcService.indexBlock(height);

            res.json({
                success: true,
                data: block,
            });
        } catch (error: any) {
            logger.error('Error in indexBlock controller:', error.message);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to index block',
            });
        }
    }

    /**
     * Get a Bitcoin block by height
     * GET /api/btc/block/:height
     */
    async getBlock(req: Request, res: Response) {
        try {
            const height = parseInt(req.params.height as string);

            if (isNaN(height) || height < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid block height',
                });
            }

            const block = await btcService.getBlockByHeight(height);

            if (!block) {
                return res.status(404).json({
                    success: false,
                    error: 'Block not found in database',
                });
            }

            res.json({
                success: true,
                data: block,
            });
        } catch (error: any) {
            logger.error('Error in getBlock controller:', error.message);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve block',
            });
        }
    }

    /**
     * Get a Bitcoin transaction by txid
     * GET /api/btc/transaction/:txid
     */
    async getTransaction(req: Request, res: Response) {
        try {
            const { txid } = req.params;

            if (!txid) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction ID is required',
                });
            }

            const transaction = await btcService.getTransactionByTxid(txid as string);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found in database',
                });
            }

            res.json({
                success: true,
                data: transaction,
            });
        } catch (error: any) {
            logger.error('Error in getTransaction controller:', error.message);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve transaction',
            });
        }
    }

    /**
     * Get the latest indexed block
     * GET /api/btc/latest
     */
    async getLatestBlock(_req: Request, res: Response) {
        try {
            const block = await btcService.getLatestBlock();

            if (!block) {
                return res.status(404).json({
                    success: false,
                    error: 'No blocks indexed yet',
                });
            }

            res.json({
                success: true,
                data: block,
            });
        } catch (error: any) {
            logger.error('Error in getLatestBlock controller:', error.message);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve latest block',
            });
        }
    }
}

export default new BtcController();
