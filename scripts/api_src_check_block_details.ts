
import prisma from './config/database';

async function checkBlock() {
    try {
        const height = 932526;
        console.log(`Checking Block ${height}...`);
        const block = await prisma.btcBlock.findUnique({
            where: { height },
            include: { transactions: true },
        });

        if (block) {
            console.log(`Block found: ${block.hash}`);
            console.log(`Tx Count: ${block.txCount}`);
            console.log(`Stored Txs: ${block.transactions.length}`);
            if (block.transactions.length > 0) {
                console.log('First transaction:', JSON.stringify(block.transactions[0], null, 2));
            }
        } else {
            console.log('Block not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBlock();
