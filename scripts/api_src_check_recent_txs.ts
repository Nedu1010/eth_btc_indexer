
import prisma from './config/database';
import btcService from './services/btc.service';

async function checkRecent() {
    try {
        console.log('Checking recent transactions...');
        const txs = await btcService.getRecentTransactions(10);
        console.log(`Found ${txs.length} transactions`);
        if (txs.length > 0) {
            console.log('First tx:', JSON.stringify(txs[0], null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecent();
