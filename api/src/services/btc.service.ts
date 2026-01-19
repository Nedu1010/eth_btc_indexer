import prisma from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';

const MEMPOOL_API = 'https://mempool.space/api';

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
    /**
     * Get transaction from database by txid, enriched with details from Mempool.space
     */
    async getTransactionByTxid(txid: string) {
        try {
            // Get basic info from DB
            const dbTransaction = await prisma.btcTransaction.findUnique({
                where: { txid },
                include: { block: true },
            });

            if (!dbTransaction) return null;
            return dbTransaction;
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
                        vin: true,
                        vout: true,
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
                    vin: true,
                    vout: true,
                    createdAt: true,
                    blockId: true,
                },
            });
        } catch (error: any) {
            logger.error(`Error retrieving recent BTC transactions: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get transactions for a specific address
     */
    async getTransactionsByAddress(address: string, limit: number = 50) {
        try {
            // Query transactions where the address appears in inputs (vin) or outputs (vout)
            // Note: This relies on the JSON structure of vin/vout
            const transactions = await prisma.btcTransaction.findMany({
                where: {
                    OR: [
                        {
                            vin: {
                                array_contains: [{ prevout: { scriptpubkey_address: address } }]
                            }
                        },
                        {
                            vout: {
                                array_contains: [{ scriptpubkey_address: address }]
                            }
                        }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    block: {
                        select: {
                            height: true,
                            timestamp: true
                        }
                    }
                }
            });
            return transactions;
        } catch (error: any) {
            logger.error(`Error retrieving BTC transactions for address ${address}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get address balance from Mempool.space
     */
    async getBalance(address: string): Promise<string> {
        try {
            const response = await axios.get(`${MEMPOOL_API}/address/${address}`);
            const data = response.data;
            const chainStats = data.chain_stats;
            const mempoolStats = data.mempool_stats;

            const funded = chainStats.funded_txo_sum + mempoolStats.funded_txo_sum;
            const spent = chainStats.spent_txo_sum + mempoolStats.spent_txo_sum;
            const balance = funded - spent;

            return balance.toString();
        } catch (error: any) {
            logger.warn(`Failed to fetch balance for ${address}: ${error.message}`);
            return '0';
        }
    }
}

export default new BtcService();
