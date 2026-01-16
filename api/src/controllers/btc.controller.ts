import { Request, Response } from 'express';
import btcService from '../services/btc.service';
import { logger } from '../utils/logger';

class BtcController {
    /**
     * Get block by height
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
                    error: 'Block not found',
                });
            }

            return res.json({
                success: true,
                data: block,
            });
        } catch (error: any) {
            logger.error(`Error in getBlock: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }

    /**
     * Get transaction by TXID
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
                    error: 'Transaction not found',
                });
            }

            return res.json({
                success: true,
                data: transaction,
            });
        } catch (error: any) {
            logger.error(`Error in getTransaction: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }

    /**
     * Get latest block
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

            return res.json({
                success: true,
                data: block,
            });
        } catch (error: any) {
            logger.error(`Error in getLatestBlock: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }

    /**
     * Get recent blocks
     */
    async getRecentBlocks(req: Request, res: Response) {
        try {
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
            const blocks = await btcService.getRecentBlocks(limit);

            return res.json({
                success: true,
                data: blocks,
            });
        } catch (error: any) {
            logger.error(`Error in getRecentBlocks: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }

    /**
     * Get recent transactions
     */
    async getRecentTransactions(req: Request, res: Response) {
        try {
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
            const transactions = await btcService.getRecentTransactions(limit);

            return res.json({
                success: true,
                data: transactions,
            });
        } catch (error: any) {
            logger.error(`Error in getRecentTransactions: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * Get paginated blocks
     */
    async getBlocks(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

            const result = await btcService.getBlocks(page, limit);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            logger.error(`Error in getBlocks: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }

    /**
     * Get paginated transactions
     */
    async getTransactions(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

            const result = await btcService.getTransactions(page, limit);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            logger.error(`Error in getTransactions: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
}

export default new BtcController();
