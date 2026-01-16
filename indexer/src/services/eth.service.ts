import axios, { AxiosInstance } from 'axios';
import prisma from '../config/database';
import { logger } from '../utils/logger';

interface EthBlockResponse {
    number: string;
    hash: string;
    parentHash: string;
    timestamp: string;
    miner: string;
    gasLimit: string;
    gasUsed: string;
    baseFeePerGas?: string;
    difficulty: string;
    totalDifficulty?: string;
    size: string;
    transactions: string[] | EthTransactionResponse[];
}

interface EthTransactionResponse {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    gas: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce: string;
    transactionIndex: string;
    input: string;
    blockNumber: string;
    blockHash: string;
}

class EthService {
    private client: AxiosInstance;
    private rpcUrl: string;

    constructor() {
        const apiKey = process.env.INFURA_RPC_API_KEY;
        if (!apiKey) {
            throw new Error('INFURA_RPC_API_KEY is not set in environment variables');
        }

        this.rpcUrl = `https://mainnet.infura.io/v3/${apiKey}`;
        this.client = axios.create({
            baseURL: this.rpcUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Make a JSON-RPC call to Infura
     */
    private async rpcCall(method: string, params: any[] = []): Promise<any> {
        try {
            const response = await this.client.post('', {
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            });

            if (response.data.error) {
                throw new Error(response.data.error.message);
            }

            return response.data.result;
        } catch (error: any) {
            logger.error(`RPC call failed for method ${method}:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch block data from Infura by block number
     */
    async fetchBlockByNumber(blockNumber: number | string): Promise<EthBlockResponse> {
        try {
            logger.info(`Fetching ETH block at number ${blockNumber}`);

            const blockNumberHex = typeof blockNumber === 'number'
                ? `0x${blockNumber.toString(16)}`
                : blockNumber;

            const block = await this.rpcCall('eth_getBlockByNumber', [blockNumberHex, true]);

            if (!block) {
                throw new Error(`Block ${blockNumber} not found`);
            }

            return block;
        } catch (error: any) {
            logger.error(`Error fetching ETH block at number ${blockNumber}:`, error.message);
            throw new Error(`Failed to fetch ETH block: ${error.message}`);
        }
    }

    /**
     * Fetch transaction data from Infura
     */
    async fetchTransaction(txHash: string): Promise<EthTransactionResponse> {
        try {
            logger.info(`Fetching ETH transaction ${txHash}`);

            const tx = await this.rpcCall('eth_getTransactionByHash', [txHash]);

            if (!tx) {
                throw new Error(`Transaction ${txHash} not found`);
            }

            return tx;
        } catch (error: any) {
            logger.error(`Error fetching ETH transaction ${txHash}:`, error.message);
            throw new Error(`Failed to fetch ETH transaction: ${error.message}`);
        }
    }

    /**
     * Index an Ethereum block and its transactions
     */
    async indexBlock(blockNumber: number) {
        try {
            // Check if block already exists
            const existingBlock = await prisma.ethBlock.findUnique({
                where: { number: BigInt(blockNumber) },
            });

            if (existingBlock) {
                logger.info(`ETH block at number ${blockNumber} already indexed`);
                return existingBlock;
            }

            // Fetch block data from Infura
            const blockData = await this.fetchBlockByNumber(blockNumber);

            // Store block in database
            const block = await prisma.ethBlock.create({
                data: {
                    hash: blockData.hash,
                    number: BigInt(parseInt(blockData.number, 16)),
                    timestamp: new Date(parseInt(blockData.timestamp, 16) * 1000),
                    parentHash: blockData.parentHash,
                    miner: blockData.miner,
                    gasLimit: BigInt(parseInt(blockData.gasLimit, 16)),
                    gasUsed: BigInt(parseInt(blockData.gasUsed, 16)),
                    baseFeePerGas: blockData.baseFeePerGas ? BigInt(parseInt(blockData.baseFeePerGas, 16)) : null,
                    difficulty: BigInt(parseInt(blockData.difficulty, 16)),
                    totalDifficulty: blockData.totalDifficulty ? BigInt(parseInt(blockData.totalDifficulty, 16)) : null,
                    size: parseInt(blockData.size, 16),
                    txCount: Array.isArray(blockData.transactions) ? blockData.transactions.length : 0,
                },
            });

            // Index transactions if they are included in the response
            if (Array.isArray(blockData.transactions) && blockData.transactions.length > 0) {
                const firstTx = blockData.transactions[0];

                // Check if transactions are full objects or just hashes
                if (typeof firstTx === 'object') {
                    const txPromises = (blockData.transactions as EthTransactionResponse[]).map((tx) =>
                        this.indexTransaction(tx.hash, block.id, tx)
                    );
                    await Promise.all(txPromises);
                }
            }

            logger.info(`Successfully indexed ETH block at number ${blockNumber}`);
            return block;
        } catch (error: any) {
            logger.error(`Error indexing ETH block at number ${blockNumber}:`, error.message);
            throw error;
        }
    }

    /**
     * Index an Ethereum transaction
     */
    async indexTransaction(txHash: string, blockId: string, txData?: EthTransactionResponse) {
        try {
            // Check if transaction already exists
            const existingTx = await prisma.ethTransaction.findUnique({
                where: { hash: txHash },
            });

            if (existingTx) {
                logger.info(`ETH transaction ${txHash} already indexed`);
                return existingTx;
            }

            // Fetch transaction data if not provided
            if (!txData) {
                txData = await this.fetchTransaction(txHash);
            }

            // Store transaction in database
            const transaction = await prisma.ethTransaction.create({
                data: {
                    hash: txData.hash,
                    blockId,
                    fromAddress: txData.from,
                    toAddress: txData.to,
                    value: txData.value,
                    gas: BigInt(parseInt(txData.gas, 16)),
                    gasPrice: txData.gasPrice ? BigInt(parseInt(txData.gasPrice, 16)) : null,
                    maxFeePerGas: txData.maxFeePerGas ? BigInt(parseInt(txData.maxFeePerGas, 16)) : null,
                    maxPriorityFeePerGas: txData.maxPriorityFeePerGas ? BigInt(parseInt(txData.maxPriorityFeePerGas, 16)) : null,
                    nonce: parseInt(txData.nonce, 16),
                    transactionIndex: parseInt(txData.transactionIndex, 16),
                    input: txData.input,
                },
            });

            logger.info(`Successfully indexed ETH transaction ${txHash}`);
            return transaction;
        } catch (error: any) {
            logger.error(`Error indexing ETH transaction ${txHash}:`, error.message);
            throw error;
        }
    }

    /**
     * Get block from database by number
     */
    async getBlockByNumber(blockNumber: number) {
        try {
            const block = await prisma.ethBlock.findUnique({
                where: { number: BigInt(blockNumber) },
                include: { transactions: true },
            });
            return block;
        } catch (error: any) {
            logger.error(`Error retrieving ETH block at number ${blockNumber}:`, error.message);
            throw error;
        }
    }

    /**
     * Get transaction from database by hash
     */
    async getTransactionByHash(hash: string) {
        try {
            const transaction = await prisma.ethTransaction.findUnique({
                where: { hash },
                include: { block: true },
            });
            return transaction;
        } catch (error: any) {
            logger.error(`Error retrieving ETH transaction ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Get latest indexed block
     */
    async getLatestBlock() {
        try {
            const block = await prisma.ethBlock.findFirst({
                orderBy: { number: 'desc' },
            });
            return block;
        } catch (error: any) {
            logger.error('Error retrieving latest ETH block:', error.message);
            throw error;
        }
    }
}

export default new EthService();
