import cron from 'node-cron';
import ethService from '../services/eth.service';
import { logger } from '../utils/logger';

class EthCronService {
    private isRunning = false;

    /**
     * Get the latest block number from Infura
     */
    private async getLatestBlockNumber(): Promise<number> {
        try {
            const apiKey = process.env.INFURA_RPC_API_KEY;
            const response = await fetch(`https://mainnet.infura.io/v3/${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_blockNumber',
                    params: [],
                }),
            });

            const data = await response.json() as { result: string };
            return parseInt(data.result, 16);
        } catch (error: any) {
            logger.error('Error fetching latest ETH block number:', error.message);
            throw error;
        }
    }

    /**
     * Sync latest Ethereum blocks
     */
    async syncLatestBlocks() {
        if (this.isRunning) {
            logger.info('ETH sync already running, skipping...');
            return;
        }

        this.isRunning = true;
        try {
            logger.info('Starting ETH block sync...');

            // Get latest block number from blockchain
            const latestBlockNumber = await this.getLatestBlockNumber();
            logger.info(`Latest ETH block number: ${latestBlockNumber}`);

            // Get latest indexed block from database
            const latestIndexedBlock = await ethService.getLatestBlock();
            const startBlock = latestIndexedBlock
                ? Number(latestIndexedBlock.number) + 1
                : latestBlockNumber;

            if (startBlock > latestBlockNumber) {
                logger.info('ETH blockchain is already up to date');
                return;
            }

            // Index new blocks (limit to 20 blocks per run to keep up with chain ~15 blocks/3min)
            const blocksToSync = Math.min(20, latestBlockNumber - startBlock + 1);
            logger.info(`Syncing ${blocksToSync} ETH blocks from ${startBlock} to ${startBlock + blocksToSync - 1}`);

            for (let blockNum = startBlock; blockNum < startBlock + blocksToSync; blockNum++) {
                try {
                    await ethService.indexBlock(blockNum);
                    logger.info(`Successfully indexed ETH block ${blockNum}`);
                } catch (error: any) {
                    logger.error(`Failed to index ETH block ${blockNum}:`, error.message);
                    // Continue with next block even if one fails
                }
            }

            logger.info('ETH block sync completed');
        } catch (error: any) {
            logger.error('Error during ETH sync:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Start the cron job to sync Ethereum blocks every 3 minutes
     */
    startCronJob() {
        // Run every 3 minutes
        cron.schedule('*/3 * * * *', async () => {
            logger.info('ETH cron job triggered');
            await this.syncLatestBlocks();
        });

        logger.info('ETH cron job scheduled (every 3 minutes)');

        // Run immediately on startup
        this.syncLatestBlocks();
    }
}

export default new EthCronService();
