
import dotenv from 'dotenv';
import path from 'path';

// Load env vars - we are in api/src, so .env is in ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import ethService from './services/eth.service';

async function verify() {
    console.log('Verifying ETH balance fetch...');

    // Vitalik's address
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

    try {
        const balance = await ethService.getBalance(address);
        console.log(`Balance for ${address}: ${balance} Wei`);

        if (balance !== '0') {
            console.log('SUCCESS: Fetched non-zero balance.');
        } else {
            console.log('WARNING: Balance is 0. This might be correct, or RPC failed silently (check logs).');
            // Check if API key is actually loaded
            if (!process.env.INFURA_RPC_API_KEY) {
                console.error('FAILURE: INFURA_RPC_API_KEY is missing in process.env');
            } else {
                console.log('Env var INFURA_RPC_API_KEY is present.');
            }
        }
    } catch (error) {
        console.error('ERROR:', error);
    }
}

verify();
