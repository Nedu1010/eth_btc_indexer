import axios from 'axios';
import type { ApiResponse, BtcBlock, EthBlock, BtcTransaction, EthTransaction, Network, Account } from '../types';

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

    async getAccounts(limit: number = 50): Promise<Account[]> {
        try {
            const response = await axios.get<ApiResponse<Account[]>>(
                `${API_URL}/api/eth/accounts`,
                { params: { limit } }
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching ETH accounts:', error);
            return [];
        }
    }

    async getAccountDetails(address: string, limit: number = 50): Promise<EthTransaction[]> {
        try {
            const response = await axios.get<ApiResponse<EthTransaction[]>>(
                `${API_URL}/api/eth/account/${address}`,
                { params: { limit } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching account details for ${address}:`, error);
            return [];
        }
    }

    async getBlocks(network: Network, page: number = 1, limit: number = 10): Promise<{ blocks: (BtcBlock | EthBlock)[], total: number }> {
        try {
            const response = await axios.get<ApiResponse<{ blocks: (BtcBlock | EthBlock)[], pagination: { total: number } }>>(
                `${API_URL}/api/${network}/blocks`,
                { params: { page, limit } }
            );
            return {
                blocks: response.data.data.blocks,
                total: response.data.data.pagination.total
            };
        } catch (error) {
            console.error(`Error fetching ${network} blocks:`, error);
            return { blocks: [], total: 0 };
        }
    }

    async getTransactions(network: Network, page: number = 1, limit: number = 10): Promise<{ transactions: (BtcTransaction | EthTransaction)[], total: number }> {
        try {
            const response = await axios.get<ApiResponse<{ transactions: (BtcTransaction | EthTransaction)[], pagination: { total: number } }>>(
                `${API_URL}/api/${network}/transactions`,
                { params: { page, limit } }
            );
            return {
                transactions: response.data.data.transactions,
                total: response.data.data.pagination.total
            };
        } catch (error) {
            console.error(`Error fetching ${network} transactions:`, error);
            return { transactions: [], total: 0 };
        }
    }
}

export default new ApiService();
