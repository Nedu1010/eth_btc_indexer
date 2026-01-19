import axios from 'axios';
import type { ApiResponse, BtcBlock, EthBlock, BtcTransaction, EthTransaction, Network, Account } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

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

    async getBlock(network: Network, heightOrNumber: number | string): Promise<BtcBlock | EthBlock | null> {
        try {
            const response = await axios.get<ApiResponse<BtcBlock | EthBlock>>(
                `${API_URL}/api/${network}/block/${heightOrNumber}`
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching ${network} block ${heightOrNumber}:`, error);
            return null;
        }
    }

    async getTransaction(network: Network, txid: string): Promise<BtcTransaction | EthTransaction | null> {
        try {
            const response = await axios.get<ApiResponse<BtcTransaction | EthTransaction>>(
                `${API_URL}/api/${network}/transaction/${txid}`
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching ${network} transaction ${txid}:`, error);
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

    async getAccountDetails(network: Network, address: string, limit: number = 50): Promise<{ transactions: (BtcTransaction | EthTransaction)[], balance: string }> {
        try {
            const response = await axios.get<ApiResponse<{ transactions: (BtcTransaction | EthTransaction)[], balance: string }>>(
                `${API_URL}/api/${network}/account/${address}`,
                { params: { limit } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching account details for ${address} on ${network}:`, error);
            return { transactions: [], balance: '0' };
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
