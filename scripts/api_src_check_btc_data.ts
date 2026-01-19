
import prisma from './config/database';

async function checkData() {
    try {
        console.log('Checking BTC blocks...');
        const blocks = await prisma.btcBlock.findMany({
            where: {
                txCount: { gt: 0 }
            },
            include: {
                _count: {
                    select: { transactions: true }
                }
            },
            orderBy: {
                height: 'desc'
            },
            take: 10
        });

        console.log('Found blocks:', blocks.length);
        for (const block of blocks) {
            console.log(`Block ${block.height}: txCount=${block.txCount}, stored_transactions=${block._count.transactions}`);
            if (block.txCount > 0 && block._count.transactions === 0) {
                console.log(`WARNING: Block ${block.height} has ${block.txCount} transactions but 0 stored!`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
