// Network type
export type Network = 'btc' | 'eth';

// Bitcoin Block
export interface BtcBlock {
    id: string;
    hash: string;
    height: number;
    timestamp: string;
    txCount: number;
    size?: number;
    weight?: number;
    difficulty?: number;
}

// Ethereum Block
export interface EthBlock {
    id: string;
    hash: string;
    number: bigint | string;
    timestamp: string;
    parentHash: string;
    miner: string;
    gasLimit: bigint | string;
    gasUsed: bigint | string;
    baseFeePerGas?: bigint | string;
    size?: number;
    txCount: number;
}

// Bitcoin Transaction
export interface BtcTransaction {
    id: string;
    txid: string;
    blockId: string;
    version?: number;
    size?: number;
    weight?: number;
    fee?: bigint | string;
    inputCount?: number;
    outputCount?: number;
    createdAt: string;
}

// Ethereum Transaction
export interface EthTransaction {
    id: string;
    hash: string;
    blockId: string;
    fromAddress: string;
    toAddress?: string;
    value: string;
    gas: bigint | string;
    gasPrice?: bigint | string;
    maxFeePerGas?: bigint | string;
    nonce: number;
    transactionIndex: number;
    createdAt: string;
}

// Ethereum Account
export interface Account {
    address: string;
    transactionCount: number;
    lastActivity: string;
}

// API Response
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}
