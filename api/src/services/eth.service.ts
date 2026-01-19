import prisma from '../config/database';
import { logger } from '../utils/logger';

class EthService {
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
            logger.error(`Error retrieving ETH block at number ${blockNumber}: ${error.message}`);
            throw error;
        }
    }

    private client: any;
    private rpcUrl: string = '';

    constructor() {
        // Client initialization moved to ensureClient to allow for env vars to load
    }

    private ensureClient() {
        if (this.client) return;

        const apiKey = process.env.INFURA_RPC_API_KEY;
        this.rpcUrl = apiKey ? `https://mainnet.infura.io/v3/${apiKey}` : '';

        if (this.rpcUrl) {
            // dynamic import to avoid issues if axios isn't available (though it should be)
            const axios = require('axios');
            this.client = axios.create({
                baseURL: this.rpcUrl,
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } else {
            logger.warn('INFURA_RPC_API_KEY not set');
        }
    }

    /**
     * Make a JSON-RPC call to Infura
     */
    private async rpcCall(method: string, params: any[] = []): Promise<any> {
        this.ensureClient();

        if (!this.client) {
            logger.warn('RPC client not initialized (missing API key)');
            return null;
        }

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
            logger.error(`RPC call failed for method ${method}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get address balance from Infura
     */
    async getBalance(address: string): Promise<string> {
        try {
            const balanceHex = await this.rpcCall('eth_getBalance', [address, 'latest']);
            if (!balanceHex) return '0';
            return BigInt(balanceHex).toString();
        } catch (error: any) {
            logger.warn(`Failed to fetch ETH balance for ${address}: ${error.message}`);
            return '0';
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
            logger.error(`Error retrieving ETH transaction ${hash}: ${error.message}`);
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
            logger.error(`Error retrieving latest ETH block: ${error.message}`);
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
                prisma.ethBlock.findMany({
                    orderBy: { number: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        hash: true,
                        number: true,
                        timestamp: true,
                        parentHash: true,
                        miner: true,
                        gasLimit: true,
                        gasUsed: true,
                        baseFeePerGas: true,
                        size: true,
                        txCount: true,
                    },
                }),
                prisma.ethBlock.count(),
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
            logger.error(`Error retrieving ETH blocks: ${error.message}`);
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
                prisma.ethTransaction.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        hash: true,
                        fromAddress: true,
                        toAddress: true,
                        value: true,
                        gas: true,
                        gasPrice: true,
                        maxFeePerGas: true,
                        nonce: true,
                        transactionIndex: true,
                        createdAt: true,
                        block: {
                            select: {
                                number: true,
                                timestamp: true,
                            },
                        },
                    },
                }),
                prisma.ethTransaction.count(),
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
            logger.error(`Error retrieving ETH transactions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get recent blocks
     */
    async getRecentBlocks(limit: number = 10) {
        try {
            return await prisma.ethBlock.findMany({
                orderBy: { number: 'desc' },
                take: limit,
                select: {
                    id: true,
                    hash: true,
                    number: true,
                    timestamp: true,
                    miner: true,
                    gasUsed: true,
                    size: true,
                    txCount: true,
                },
            });
        } catch (error: any) {
            logger.error(`Error retrieving recent ETH blocks: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get recent transactions
     */
    async getRecentTransactions(limit: number = 10) {
        try {
            return await prisma.ethTransaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true,
                    hash: true,
                    fromAddress: true,
                    toAddress: true,
                    value: true,
                    gasPrice: true,
                    maxFeePerGas: true,
                    gas: true,
                    createdAt: true,
                    blockId: true,
                },
            });
        } catch (error: any) {
            logger.error(`Error retrieving recent ETH transactions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get accounts (unique addresses) with transaction counts
     */
    async getAccounts(limit: number = 50) {
        try {
            // Get unique addresses from both fromAddress and toAddress
            const addresses = await prisma.$queryRaw<{ address: string; tx_count: bigint; last_activity: Date }[]>`
                SELECT 
                    address,
                    COUNT(*) as tx_count,
                    MAX(created_at) as last_activity
                FROM (
                    SELECT from_address as address, created_at
                    FROM eth_transactions
                    UNION ALL
                    SELECT to_address as address, created_at
                    FROM eth_transactions
                    WHERE to_address IS NOT NULL
                ) as all_addresses
                GROUP BY address
                ORDER BY tx_count DESC
                LIMIT ${limit}
            `;

            return addresses.map((addr) => ({
                address: addr.address,
                transactionCount: Number(addr.tx_count),
                lastActivity: addr.last_activity.toISOString(),
            }));
        } catch (error: any) {
            logger.error(`Error retrieving ETH accounts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get account details (transactions for a specific address)
     */
    async getAccountDetails(address: string, limit: number = 50) {
        try {
            const transactions = await prisma.ethTransaction.findMany({
                where: {
                    OR: [
                        { fromAddress: address },
                        { toAddress: address },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true,
                    hash: true,
                    fromAddress: true,
                    toAddress: true,
                    value: true,
                    gas: true,
                    gasPrice: true,
                    maxFeePerGas: true,
                    createdAt: true,
                    block: {
                        select: {
                            number: true,
                            timestamp: true,
                        },
                    },
                },
            });

            return transactions;
        } catch (error: any) {
            logger.error(`Error retrieving account details for ${address}: ${error.message}`);
            throw error;
        }
    }
}

export default new EthService();
