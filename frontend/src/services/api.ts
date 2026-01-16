import axios from 'axios';
import type { ApiResponse, BtcBlock, EthBlock, BtcTransaction, EthTransaction, Network } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
    async getLatestBlock(network: Network): Promise<BtcBlock | EthBlock | null> {
        try {
            const response = await axios.get<ApiResponse<BtcBlock | EthBlock>>(
                `${API_URL}/api/${network}/latest`
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching latest ${network} block:`, error);
            return null;
        }
    }

    async getRecentBlocks(network: Network, limit: number = 10): Promise<(BtcBlock | EthBlock)[]> {
        try {
            const response = await axios.get<ApiResponse<(BtcBlock | EthBlock)[]>>(
                `${API_URL}/api/${network}/recent-blocks`,
                { params: { limit } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching recent ${network} blocks:`, error);
            return [];
        }
    }

    async getRecentTransactions(network: Network, limit: number = 10): Promise<(BtcTransaction | EthTransaction)[]> {
        try {
            const response = await axios.get<ApiResponse<(BtcTransaction | EthTransaction)[]>>(
                `${API_URL}/api/${network}/recent-transactions`,
                { params: { limit } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching recent ${network} transactions:`, error);
            return [];
        }
    }
}

export default new ApiService();
