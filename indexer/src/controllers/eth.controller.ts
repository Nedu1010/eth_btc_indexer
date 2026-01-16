import { Request, Response } from 'express';
import ethService from '../services/eth.service';
import { logger } from '../utils/logger';

class EthController {
    /**
     * Index an Ethereum block by number
     * POST /api/eth/index/:number
     */
    async indexBlock(req: Request, res: Response) {
        try {
            const blockNumber = parseInt(req.params.number as string);

            if (isNaN(blockNumber) || blockNumber < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid block number',
                });
            }

            const block = await ethService.indexBlock(blockNumber);

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
     * Get an Ethereum block by number
     * GET /api/eth/block/:number
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
     * Get an Ethereum transaction by hash
     * GET /api/eth/transaction/:hash
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
     * GET /api/eth/latest
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

export default new EthController();
