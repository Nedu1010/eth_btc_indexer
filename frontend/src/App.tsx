import { useState, useEffect } from 'react';
import type { Network, BtcBlock, EthBlock, BtcTransaction, EthTransaction } from './types';
import apiService from './services/api';
import { formatBtcValue, truncateHash } from './utils';
import './index.css';

function App() {
  const [network, setNetwork] = useState<Network>('btc');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blocks' | 'transactions'>('dashboard');
  const [latestBlock, setLatestBlock] = useState<BtcBlock | EthBlock | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<(BtcBlock | EthBlock)[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<(BtcTransaction | EthTransaction)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation state
  const [activeView, setActiveView] = useState<'list' | 'block-detail' | 'transaction-detail'>('list');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  
  // Pagination state for different tables
  const [blocksPage, setBlocksPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const itemsPerPage = 10;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation handlers
  const viewBlockDetail = (blockId: string) => {
    setSelectedBlockId(blockId);
    setActiveView('block-detail');
  };

  const viewTransactionDetail = (txId: string) => {
    setSelectedTxId(txId);
    setActiveView('transaction-detail');
  };

  const backToList = () => {
    setActiveView('list');
    setSelectedBlockId(null);
    setSelectedTxId(null);
  };

  // Handle search on Enter key
  const handleSearchEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return;
    
    const query = searchQuery.trim();
    
    // Try to find block or transaction
    try {
      // Check if it's a number (block height for BTC or block number for ETH)
      const numericValue = parseInt(query);
      if (!isNaN(numericValue)) {
        // Try to fetch block by number/height
        const endpoint = network === 'btc' 
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/btc/block/${numericValue}`
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/eth/block/${numericValue}`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            viewBlockDetail(data.data.id);
            setSearchQuery(''); // Clear search
            return;
          }
        }
      }
      
      // Try as transaction hash
      const txEndpoint = network === 'btc'
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/btc/transaction/${query}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/eth/transaction/${query}`;
      
      const txResponse = await fetch(txEndpoint);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        if (txData.success && txData.data) {
          viewTransactionDetail(txData.data.id);
          setSearchQuery(''); // Clear search
          return;
        }
      }
      
      // If nothing found, show alert
      alert(`No block or transaction found for "${query}"`);
    } catch (err) {
      console.error('Search error:', err);
      alert('Error searching. Please try again.');
    }
  };

  useEffect(() => {
    let isInitialLoad = true;

    const fetchDashboardData = async () => {
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
        setLatestBlock(null);
        setRecentBlocks([]);
        setRecentTransactions([]);
      }

      try {
        const [latest, blocks, transactions] = await Promise.all([
          apiService.getLatestBlock(network),
          apiService.getRecentBlocks(network, 10),
          apiService.getRecentTransactions(network, 10)
        ]);

        setLatestBlock(latest);
        setRecentBlocks(blocks);
        setRecentTransactions(transactions);
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching blockchain data:', err);
        setError(`Failed to load ${network.toUpperCase()} data. Please ensure the API server is running.`);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    fetchDashboardData();
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        fetchDashboardData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [network, activeTab]);

  // Fetch paginated blocks when page or network changes
  useEffect(() => {
    const fetchBlocks = async () => {
      if (activeTab !== 'blocks') return;
      
      setBlocksLoading(true);
      // Small delay to ensure spinner is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const { blocks, total } = await apiService.getBlocks(network, blocksPage, itemsPerPage);
        setRecentBlocks(blocks);
        setTotalBlocks(total);
      } catch (err: any) {
        console.error('Error fetching blocks:', err);
      } finally {
        setBlocksLoading(false);
      }
    };

    fetchBlocks();
  }, [network, blocksPage, activeTab]);

  // Fetch paginated transactions when page or network changes
  useEffect(() => {
    const fetchTransactions = async () => {
      if (activeTab !== 'transactions') return;
      
      setTxLoading(true);
      // Small delay to ensure spinner is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const { transactions, total } = await apiService.getTransactions(network, txPage, itemsPerPage);
        setRecentTransactions(transactions);
        setTotalTransactions(total);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
      } finally {
        setTxLoading(false);
      }
    };

    fetchTransactions();
  }, [network, txPage, activeTab]);

  // Reset pages when network or tab changes
  useEffect(() => {
    setBlocksPage(1);
    setTxPage(1);
  }, [network, activeTab]);

  const getBlockNumber = (block: BtcBlock | EthBlock | null) => {
    if (!block) return 'N/A';
    if ('height' in block) return block.height.toLocaleString();
    return block.number.toString();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && !latestBlock) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  if (error && !latestBlock) {
    return (
      <div className="container">
        <div className="loading">
          <div style={{ color: '#ff6b6b', fontSize: '1.2rem', marginBottom: '1rem' }}>⚠️ Error</div>
          <p style={{ color: '#ff6b6b' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              background: '#4a90e2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            Blockchain Explorer
          </div>
          
          <div className="navbar-links">
            <button 
              className={`navbar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); backToList(); }}
            >
              Dashboard
            </button>
            <button 
              className={`navbar-link ${activeTab === 'blocks' ? 'active' : ''}`}
              onClick={() => { setActiveTab('blocks'); backToList(); }}
            >
              Blocks
            </button>
            <button 
              className={`navbar-link ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => { setActiveTab('transactions'); backToList(); }}
            >
              Transactions
            </button>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by hash or BN (Press Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchEnter}
            />
          </div>

          <div className="network-switch">
            <button
              className={`network-btn ${network === 'btc' ? 'active' : ''}`}
              onClick={() => setNetwork('btc')}
            >
              ₿ BTC
            </button>
            <button
              className={`network-btn ${network === 'eth' ? 'active' : ''}`}
              onClick={() => setNetwork('eth')}
            >
              ⟠ ETH
            </button>
          </div>
        </div>
      </nav>
      
      <div className="container">
        {/* Block Detail View */}
        {activeView === 'block-detail' && selectedBlockId && (() => {
          const block = recentBlocks.find(b => b.id === selectedBlockId);
          if (!block) return <p>Block not found</p>;
          
          return (
            <>
              <button className="back-btn" onClick={backToList}>← Back to {activeTab}</button>
              <div className="detail-page">
                <h1>Block Details - {network.toUpperCase()}</h1>
                <div className="detail-card">
                  <div className="detail-row">
                    <span className="detail-label">{network === 'btc' ? 'Height' : 'Number'}:</span>
                    <span className="detail-value">{getBlockNumber(block)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hash:</span>
                    <span className="detail-value hash">{block.hash}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Timestamp:</span>
                    <span className="detail-value">{new Date(block.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Transactions:</span>
                    <span className="detail-value">{block.txCount}</span>
                  </div>
                  {network === 'btc' && 'size' in block && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{block.size?.toLocaleString()} bytes</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Weight:</span>
                        <span className="detail-value">{(block as BtcBlock).weight?.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Difficulty:</span>
                        <span className="detail-value">{(block as BtcBlock).difficulty?.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {network === 'eth' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Miner:</span>
                        <span className="detail-value hash">{(block as EthBlock).miner}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Gas Used:</span>
                        <span className="detail-value">{(block as EthBlock).gasUsed.toString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Gas Limit:</span>
                        <span className="detail-value">{(block as EthBlock).gasLimit.toString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* Transaction Detail View */}
        {activeView === 'transaction-detail' && selectedTxId && (() => {
          const tx = recentTransactions.find(t => t.id === selectedTxId);
          if (!tx) return <p>Transaction not found</p>;
          
          return (
            <>
              <button className="back-btn" onClick={backToList}>← Back to {activeTab}</button>
              <div className="detail-page">
                <h1>Transaction Details - {network.toUpperCase()}</h1>
                <div className="detail-card">
                  <div className="detail-row">
                    <span className="detail-label">Hash:</span>
                    <span className="detail-value hash">
                      {network === 'btc' ? (tx as BtcTransaction).txid : (tx as EthTransaction).hash}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Timestamp:</span>
                    <span className="detail-value">{new Date(tx.createdAt).toLocaleString()}</span>
                  </div>
                  {network === 'btc' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Fee:</span>
                        <span className="detail-value">{formatBtcValue((tx as BtcTransaction).fee)} satoshis</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{(tx as BtcTransaction).size} bytes</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Inputs:</span>
                        <span className="detail-value">{(tx as BtcTransaction).inputCount}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Outputs:</span>
                        <span className="detail-value">{(tx as BtcTransaction).outputCount}</span>
                      </div>
                    </>
                  )}
                  {network === 'eth' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">From:</span>
                        <span className="detail-value hash">{(tx as EthTransaction).fromAddress}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">To:</span>
                        <span className="detail-value hash">{(tx as EthTransaction).toAddress || 'Contract Creation'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Value:</span>
                        <span className="detail-value">{(tx as EthTransaction).value} Wei</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Gas:</span>
                        <span className="detail-value">{(tx as EthTransaction).gas.toString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Gas Price:</span>
                        <span className="detail-value">{(tx as EthTransaction).gasPrice?.toString() || 'N/A'} Wei</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* List Views */}
        {activeView === 'list' && (
          <>
            {activeTab === 'dashboard' && latestBlock && (
              <>
                <h1>Dashboard - {network.toUpperCase()}</h1>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Latest Block</div>
                    <div className="stat-value">{getBlockNumber(latestBlock)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Transactions</div>
                    <div className="stat-value">{latestBlock.txCount}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Block Size</div>
                    <div className="stat-value">{latestBlock.size ? `${(latestBlock.size / 1024).toFixed(2)} KB` : 'N/A'}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Last Update</div>
                    <div className="stat-value time-ago">{formatTime(latestBlock.timestamp)}</div>
                  </div>
                </div>

                <h2 className="section-title">Latest Block Details</h2>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{network === 'btc' ? 'Height' : 'Number'}</th>
                        <th>Hash</th>
                        <th>Timestamp</th>
                        <th>Transactions</th>
                        {network === 'eth' && <th>Miner</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr onClick={() => viewBlockDetail(latestBlock.id)}>
                        <td>
                          <span className="badge clickable" onClick={(e) => { e.stopPropagation(); viewBlockDetail(latestBlock.id); }}>
                            {getBlockNumber(latestBlock)}
                          </span>
                        </td>
                        <td>
                          <span className="hash" title={latestBlock.hash}>
                            {truncateHash(latestBlock.hash)}
                          </span>
                        </td>
                        <td className="time-ago">{formatTime(latestBlock.timestamp)}</td>
                        <td>{latestBlock.txCount}</td>
                        {network === 'eth' && (
                          <td><span className="hash" title={(latestBlock as EthBlock).miner}>{truncateHash((latestBlock as EthBlock).miner)}</span></td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                  <div>
                    <h2 className="section-title">Recent Blocks</h2>
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>{network === 'btc' ? 'Height' : 'Number'}</th>
                            <th>Hash</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBlocks
                            .map((block) => (
                              <tr key={block.id}>
                                <td>
                                  <span 
                                    className="badge clickable" 
                                    onClick={() => viewBlockDetail(block.id)}
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  >
                                    {getBlockNumber(block)}
                                  </span>
                                </td>
                                <td><span className="hash" title={block.hash}>{truncateHash(block.hash)}</span></td>
                                <td className="time-ago">{formatTime(block.timestamp)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h2 className="section-title">Recent Transactions</h2>
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Tx Hash</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTransactions
                            .map((tx) => {
                              const txHash = network === 'btc' ? (tx as BtcTransaction).txid : (tx as EthTransaction).hash;
                              return (
                                <tr key={tx.id}>
                                  <td>
                                    <span 
                                      className="hash clickable" 
                                      title={txHash}
                                      onClick={() => viewTransactionDetail(tx.id)}
                                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                      {truncateHash(txHash)}
                                    </span>
                                  </td>
                                  <td className="time-ago">{formatTime(tx.createdAt)}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'blocks' && (
              <>
                <h1>Recent Blocks - {network.toUpperCase()}</h1>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{network === 'btc' ? 'Height' : 'Number'}</th>
                        <th>Hash</th>
                        <th>Timestamp</th>
                        <th>Transactions</th>
                        {network === 'eth' && <th>Miner</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {recentBlocks
                        .map((block) => (
                          <tr key={block.id}>
                            <td>
                              <span 
                                className="badge clickable" 
                                onClick={() => viewBlockDetail(block.id)}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                {getBlockNumber(block)}
                              </span>
                            </td>
                            <td><span className="hash" title={block.hash}>{truncateHash(block.hash)}</span></td>
                            <td className="time-ago">{formatTime(block.timestamp)}</td>
                            <td>{block.txCount}</td>
                            {network === 'eth' && (
                              <td><span className="hash" title={(block as EthBlock).miner}>{truncateHash((block as EthBlock).miner)}</span></td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => setBlocksPage(Math.max(1, blocksPage - 1))}
                    disabled={blocksPage === 1 || blocksLoading}
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page {blocksPage} of {Math.ceil(totalBlocks / itemsPerPage) || 1}
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setBlocksPage(Math.min(Math.ceil(totalBlocks / itemsPerPage), blocksPage + 1))}
                    disabled={blocksLoading || (totalBlocks > 0 && blocksPage >= Math.ceil(totalBlocks / itemsPerPage))}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}

            {activeTab === 'transactions' && (
              <>
                <h1>Recent Transactions - {network.toUpperCase()}</h1>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Tx Hash</th>
                        <th>Time</th>
                        {network === 'btc' && (
                          <>
                            <th>Fee</th>
                            <th>Inputs</th>
                            <th>Outputs</th>
                          </>
                        )}
                        {network === 'eth' && (
                          <>
                            <th>From</th>
                            <th>To</th>
                            <th>Value</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions
                        .map((tx) => {
                          const txHash = network === 'btc' ? (tx as BtcTransaction).txid : (tx as EthTransaction).hash;
                          return (
                            <tr key={tx.id}>
                              <td>
                                <span 
                                  className="hash clickable" 
                                  title={txHash}
                                  onClick={() => viewTransactionDetail(tx.id)}
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  {truncateHash(txHash)}
                                </span>
                              </td>
                              <td className="time-ago">{formatTime(tx.createdAt)}</td>
                              {network === 'btc' && (
                                <>
                                  <td>{formatBtcValue((tx as BtcTransaction).fee)}</td>
                                  <td>{(tx as BtcTransaction).inputCount}</td>
                                  <td>{(tx as BtcTransaction).outputCount}</td>
                                </>
                              )}
                              {network === 'eth' && (
                                <>
                                  <td><span className="hash" title={(tx as EthTransaction).fromAddress}>{truncateHash((tx as EthTransaction).fromAddress)}</span></td>
                                  <td><span className="hash" title={(tx as EthTransaction).toAddress || ''}>{truncateHash((tx as EthTransaction).toAddress)}</span></td>
                                  <td>{(tx as EthTransaction).value}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => setTxPage(Math.max(1, txPage - 1))}
                    disabled={txPage === 1 || txLoading}
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page {txPage} of {Math.ceil(totalTransactions / itemsPerPage) || 1}
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setTxPage(Math.min(Math.ceil(totalTransactions / itemsPerPage), txPage + 1))}
                    disabled={txLoading || (totalTransactions > 0 && txPage >= Math.ceil(totalTransactions / itemsPerPage))}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
