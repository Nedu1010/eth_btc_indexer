import cron from 'node-cron';
import btcService from '../services/btc.service';
import { logger } from '../utils/logger';

class BtcCronService {
    private isRunning = false;

    /**
   * Get the latest block height from Bitcoin Node
   */
    private async getLatestBlockHeight(): Promise<number> {
        return await btcService.getBlockchainHeight();
    }

    /**
     * Sync latest Bitcoin blocks
     */
    async syncLatestBlocks() {
        if (this.isRunning) {
            logger.info('BTC sync already running, skipping...');
            return;
        }

        this.isRunning = true;
        try {
            logger.info('Starting BTC block sync...');

            // Get latest block height from blockchain
            const latestBlockHeight = await this.getLatestBlockHeight();
            logger.info(`Latest BTC block height: ${latestBlockHeight}`);

            // Get latest indexed block from database
            const latestIndexedBlock = await btcService.getLatestBlock();
            const startHeight = latestIndexedBlock ? latestIndexedBlock.height + 1 : latestBlockHeight;

            if (startHeight > latestBlockHeight) {
                logger.info('BTC blockchain is already up to date');
                return;
            }

            // Index new blocks (limit to 5 blocks per run since we are now indexing ALL transactions)
            const blocksToSync = Math.min(5, latestBlockHeight - startHeight + 1);
            logger.info(`Syncing ${blocksToSync} BTC blocks from ${startHeight} to ${startHeight + blocksToSync - 1}`);

            for (let height = startHeight; height < startHeight + blocksToSync; height++) {
                try {
                    await btcService.indexBlock(height);
                    logger.info(`Successfully indexed BTC block ${height}`);
                } catch (error: any) {
                    logger.error(`Failed to index BTC block ${height}:`, error.message);
                    // Continue with next block even if one fails
                }
            }

            logger.info('BTC block sync completed');
        } catch (error: any) {
            logger.error('Error during BTC sync:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Start the cron job to sync Bitcoin blocks every 5 minutes
     */
    startCronJob() {
        // Run every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            logger.info('BTC cron job triggered');
            await this.syncLatestBlocks();
        });

        logger.info('BTC cron job scheduled (every 5 minutes)');

        // Run immediately on startup
        this.syncLatestBlocks();
    }
}

export default new BtcCronService();
