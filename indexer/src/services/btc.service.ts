import axios, { AxiosInstance } from 'axios';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import env from '../config/env';

interface BtcBlockResponse {
    id: string;
    height: number;
    version: number;
    timestamp: number;
    tx_count: number;
    size: number;
    weight: number;
    merkle_root: string;
    previousblockhash: string;
    mediantime: number;
    nonce: number;
    bits: number;
    difficulty: number;
}

interface BtcTransactionResponse {
    txid: string;
    version: number;
    locktime: number;
    vin: any[];
    vout: any[];
    size: number;
    weight: number;
    fee: number;
    status: {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    };
}

class BtcService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: env.api.mempoolUrl,
            timeout: 30000,
        });
    }

    /**
     * Fetch block data from Mempool.space by height
     */
    async fetchBlockByHeight(height: number): Promise<BtcBlockResponse> {
        try {
            logger.info(`Fetching BTC block at height ${height} from Mempool.space`);

            // 1. Get block hash for the height
            const hashResponse = await this.client.get(`/block-height/${height}`);
            const blockHash = hashResponse.data;

            // 2. Get block details
            const blockResponse = await this.client.get(`/block/${blockHash}`);
            return blockResponse.data;
        } catch (error: any) {
            logger.error(`Error fetching BTC block at height ${height}:`, error.message);
            throw new Error(`Failed to fetch BTC block: ${error.message}`);
        }
    }

    /**
     * Fetch transactions for a block from Mempool.space
     */
    async fetchBlockTransactions(hash: string): Promise<BtcTransactionResponse[]> {
        try {
            logger.info(`Fetching transactions for BTC block ${hash}`);
            const response = await this.client.get(`/block/${hash}/txs`);
            return response.data;
        } catch (error: any) {
            logger.error(`Error fetching transactions for BTC block ${hash}:`, error.message);
            throw new Error(`Failed to fetch BTC transactions: ${error.message}`);
        }
    }

    /**
     * Index a Bitcoin block and its transactions
     */
    async indexBlock(height: number) {
        try {
            // Check if block already exists
            const existingBlock = await prisma.btcBlock.findUnique({
                where: { height },
            });

            if (existingBlock) {
                logger.info(`BTC block at height ${height} already indexed`);
                return existingBlock;
            }

            // Fetch block data from Mempool.space
            const blockData = await this.fetchBlockByHeight(height);

            // Store block in database
            const block = await prisma.btcBlock.create({
                data: {
                    hash: blockData.id,
                    height: blockData.height,
                    timestamp: new Date(blockData.timestamp * 1000),
                    txCount: blockData.tx_count,
                    size: blockData.size,
                    weight: blockData.weight,
                    version: blockData.version,
                    merkleRoot: blockData.merkle_root,
                    nonce: BigInt(blockData.nonce),
                    difficulty: blockData.difficulty,
                },
            });

            // Index transactions (Mempool.space returns first 25 by default, which is fine for verification)
            const transactions = await this.fetchBlockTransactions(blockData.id);

            if (transactions && transactions.length > 0) {
                logger.info(`Indexing ${transactions.length} transactions for block ${height}...`);

                const txPromises = transactions.map(tx =>
                    this.indexTransactionData(tx, block.id)
                );

                await Promise.allSettled(txPromises);
            }

            logger.info(`Successfully indexed BTC block at height ${height}`);
            return block;
        } catch (error: any) {
            logger.error(`Error indexing BTC block at height ${height}:`, error.message);
            throw error;
        }
    }

    /**
     * Helper to index transaction data provided directly
     */
    private async indexTransactionData(txData: BtcTransactionResponse, blockId: string) {
        try {
            // Check if transaction already exists
            const existingTx = await prisma.btcTransaction.findUnique({
                where: { txid: txData.txid },
            });

            if (existingTx) return existingTx;

            return await prisma.btcTransaction.create({
                data: {
                    txid: txData.txid,
                    blockId,
                    version: txData.version,
                    size: txData.size,
                    weight: txData.weight,
                    fee: BigInt(txData.fee || 0),
                    inputCount: txData.vin.length,
                    outputCount: txData.vout.length,
                },
            });
        } catch (error: any) {
            logger.warn(`Failed to index BTC tx ${txData.txid}: ${error.message}`);
            return null;
        }
    }

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
            logger.error(`Error retrieving BTC block at height ${height}:`, error.message);
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
            logger.error(`Error retrieving BTC transaction ${txid}:`, error.message);
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
            logger.error('Error retrieving latest BTC block:', error.message);
            throw error;
        }
    }

    /**
     * Get current blockchain height from Mempool.space
     */
    async getBlockchainHeight(): Promise<number> {
        try {
            const response = await this.client.get('/blocks/tip/height');
            return response.data;
        } catch (error: any) {
            logger.error('Error fetching blockchain height:', error.message);
            throw error;
        }
    }
}

export default new BtcService();
