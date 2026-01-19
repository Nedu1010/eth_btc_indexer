import prisma from './src/config/database';

async function main() {
    try {
        console.log('Checking for incomplete BTC blocks...');

        const latestBlock = await prisma.btcBlock.findFirst({
            orderBy: { height: 'desc' },
            include: { transactions: true }
        });

        if (!latestBlock) {
            console.log('No BTC blocks found.');
            return;
        }

        console.log(`Latest Block Height: ${latestBlock.height}`);
        console.log(`Expected Tx Count: ${latestBlock.txCount}`);
        console.log(`Actual Tx Count: ${latestBlock.transactions.length}`);

        if (latestBlock.transactions.length === 0 && latestBlock.txCount > 0) {
            console.log('Block is incomplete. Deleting to force re-indexing...');
            await prisma.btcBlock.delete({
                where: { id: latestBlock.id }
            });
            console.log('Block deleted.');
        } else {
            console.log('Block seems fine (or empty).');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
