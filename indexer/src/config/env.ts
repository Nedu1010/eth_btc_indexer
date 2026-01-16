import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from local directory
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log('Loading .env from:', envPath);
console.log('INFURA_RPC_API_KEY loaded:', process.env.INFURA_RPC_API_KEY ? 'YES' : 'NO');

export default {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL!,
    },
    api: {
        infuraApiKey: process.env.INFURA_RPC_API_KEY!,
        mempoolUrl: process.env.MEMPOOL_API_URL || 'https://mempool.space/api',
        btcNode: {
            url: process.env.BTC_RPC_URL || 'http://localhost:8332',
            user: process.env.BTC_RPC_USER || 'rpcuser',
            password: process.env.BTC_RPC_PASSWORD || 'rpcpassword',
        }
    },
};
