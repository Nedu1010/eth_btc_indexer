import { Request, Response } from 'express';
import ethService from '../services/eth.service';
import { logger } from '../utils/logger';

class EthController {
    /**
     * Get block by number
     */
    async getBlock(req: Request, res: Response) {
        try {
            const blockNumber = parseInt(req.params.number as string);

            if (isNaN(blockNumber) || blockNumber < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid block number',
                });
            }

            const block = await ethService.getBlockByNumber(blockNumber);

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
     * Get transaction by hash
     */
    async getTransaction(req: Request, res: Response) {
        try {
            const { hash } = req.params;

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction hash is required',
                });
            }

            const transaction = await ethService.getTransactionByHash(hash as string);

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
            const block = await ethService.getLatestBlock();

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
            const blocks = await ethService.getRecentBlocks(limit);

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
            const transactions = await ethService.getRecentTransactions(limit);

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
}

export default new EthController();
