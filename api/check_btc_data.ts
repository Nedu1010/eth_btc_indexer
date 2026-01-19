import prisma from './src/config/database';

async function main() {
    try {
        console.log('Checking BTC data...');

        const latestBlock = await prisma.btcBlock.findFirst({
            orderBy: { height: 'desc' },
        });

        if (!latestBlock) {
            console.log('No BTC blocks found.');
            return;
        }

        console.log('Latest Block:', latestBlock);
        console.log(`Block Height: ${latestBlock.height}`);
        console.log(`Block Hash: ${latestBlock.hash}`);
        console.log(`Tx Count in Block Header: ${latestBlock.txCount}`);

        const txCountInDb = await prisma.btcTransaction.count({
            where: { blockId: latestBlock.id },
        });

        console.log(`Actual Transactions in DB for this block: ${txCountInDb}`);

        const recentTx = await prisma.btcTransaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        console.log('Recent 5 Transactions in DB:', recentTx);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
