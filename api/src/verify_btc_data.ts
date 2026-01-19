
import dotenv from 'dotenv';
import path from 'path';
import prisma from './config/database';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verify() {
    console.log('Verifying BTC Data...');

    try {
        const blockCount = await prisma.btcBlock.count();
        const txCount = await prisma.btcTransaction.count();

        console.log(`Total BTC Blocks: ${blockCount}`);
        console.log(`Total BTC Transactions: ${txCount}`);

        const latestBlock = await prisma.btcBlock.findFirst({
            orderBy: { height: 'desc' },
            include: { transactions: true }
        });

        if (latestBlock) {
            console.log(`Latest Block Height: ${latestBlock.height}`);
            console.log(`Latest Block Hash: ${latestBlock.hash}`);
            console.log(`Latest Block Reported Tx Count: ${latestBlock.txCount}`);
            console.log(`Latest Block Actual Saved Tx Count: ${latestBlock.transactions.length}`);

            if (latestBlock.transactions.length === 0) {
                console.log('WARNING: Latest block has 0 saved transactions!');
            }
        } else {
            console.log('No blocks found.');
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
