import prisma from './src/config/database';

// const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        console.log('Fetching latest BTC block...');
        const block = await prisma.btcBlock.findFirst({
            orderBy: { height: 'desc' },
        });
        console.log('Latest BTC Block:', block?.height);

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
