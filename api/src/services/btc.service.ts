import prisma from '../config/database';
import { logger } from '../utils/logger';

class BtcService {
    /**
     * Get block from database by height
     */
    async getBlockByHeight(height: number) {
        try {
            const block = await prisma.btcBlock.findUnique({
                where: { height },
                include: { transactions: true },
            });
            return block;
        } catch (error: any) {
            logger.error(`Error retrieving BTC block at height ${height}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get transaction from database by txid
     */
    async getTransactionByTxid(txid: string) {
        try {
            const transaction = await prisma.btcTransaction.findUnique({
                where: { txid },
                include: { block: true },
            });
            return transaction;
        } catch (error: any) {
            logger.error(`Error retrieving BTC transaction ${txid}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get latest indexed block
     */
    async getLatestBlock() {
        try {
            const block = await prisma.btcBlock.findFirst({
                orderBy: { height: 'desc' },
            });
            return block;
        } catch (error: any) {
            logger.error(`Error retrieving latest BTC block: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get paginated list of blocks
     */
    async getBlocks(page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const [blocks, total] = await Promise.all([
                prisma.btcBlock.findMany({
                    orderBy: { height: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        hash: true,
                        height: true,
                        timestamp: true,
                        txCount: true,
                        size: true,
                        weight: true,
                        difficulty: true,
                    },
                }),
                prisma.btcBlock.count(),
            ]);

            return {
                blocks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            logger.error(`Error retrieving BTC blocks: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get paginated list of transactions
     */
    async getTransactions(page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const [transactions, total] = await Promise.all([
                prisma.btcTransaction.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        txid: true,
                        version: true,
                        size: true,
                        weight: true,
                        fee: true,
                        inputCount: true,
                        outputCount: true,
                        createdAt: true,
                        block: {
                            select: {
                                height: true,
                                timestamp: true,
                            },
                        },
                    },
                }),
                prisma.btcTransaction.count(),
            ]);

            return {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            logger.error(`Error retrieving BTC transactions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get recent blocks
     */
    async getRecentBlocks(limit: number = 10) {
        try {
            return await prisma.btcBlock.findMany({
                orderBy: { height: 'desc' },
                take: limit,
                select: {
                    id: true,
                    hash: true,
                    height: true,
                    timestamp: true,
                    txCount: true,
                    size: true,
                    difficulty: true,
                },
            });
        } catch (error: any) {
            logger.error(`Error retrieving recent BTC blocks: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get recent transactions
     */
    async getRecentTransactions(limit: number = 10) {
        try {
            return await prisma.btcTransaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true,
                    txid: true,
                    size: true,
                    fee: true,
                    inputCount: true,
                    outputCount: true,
                    createdAt: true,
                    blockId: true,
                },
            });
        } catch (error: any) {
            logger.error(`Error retrieving recent BTC transactions: ${error.message}`);
            throw error;
        }
    }
}

export default new BtcService();
