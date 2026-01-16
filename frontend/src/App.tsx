import { useState, useEffect } from 'react';
import type { Network, BtcBlock, EthBlock, BtcTransaction, EthTransaction } from './types';
import apiService from './services/api';
import './index.css';

function App() {
  const [network, setNetwork] = useState<Network>('btc');
  const [latestBlock, setLatestBlock] = useState<BtcBlock | EthBlock | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<(BtcBlock | EthBlock)[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<(BtcTransaction | EthTransaction)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isInitialLoad = true;

    const fetchData = async () => {
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
        // Clear previous data to prevent type mismatches during switch
        setLatestBlock(null);
        setRecentBlocks([]);
        setRecentTransactions([]);
      }

      try {
        const [latest, blocks, transactions] = await Promise.all([
          apiService.getLatestBlock(network),
          apiService.getRecentBlocks(network),
          apiService.getRecentTransactions(network)
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

    fetchData();
    const interval = setInterval(() => {
      isInitialLoad = false;
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [network]);

  const getBlockNumber = (block: BtcBlock | EthBlock | null) => {
    if (!block) return 'N/A';
    if ('height' in block) return block.height.toLocaleString();
    return block.number.toString();
  };

  const formatTime = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  const truncateHash = (hash: string | undefined) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
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
    <div className="container">
      <h1>Blockchain Explorer</h1>
      
      <div className="network-switch">
        <button
          className={`network-btn ${network === 'btc' ? 'active' : ''}`}
          onClick={() => setNetwork('btc')}
        >
          Bitcoin (BTC)
        </button>
        <button
          className={`network-btn ${network === 'eth' ? 'active' : ''}`}
          onClick={() => setNetwork('eth')}
        >
          Ethereum (ETH)
        </button>
      </div>

      {latestBlock && (
        <>
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
              <div className="stat-label">Network</div>
              <div className="stat-value">{network.toUpperCase()}</div>
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
                <tr>
                  <td><span className="badge">{getBlockNumber(latestBlock)}</span></td>
                  <td className="hash">{truncateHash(latestBlock.hash)}</td>
                  <td className="time-ago">{formatTime(latestBlock.timestamp)}</td>
                  <td>{latestBlock.txCount}</td>
                  {network === 'eth' && (
                    <td className="hash">{truncateHash((latestBlock as EthBlock).miner)}</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
                    {recentBlocks.map((block) => (
                      <tr key={block.id}>
                        <td><span className="badge">{getBlockNumber(block)}</span></td>
                        <td className="hash">{truncateHash(block.hash)}</td>
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
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="hash">{truncateHash(network === 'btc' ? (tx as BtcTransaction).txid : (tx as EthTransaction).hash)}</td>
                        <td className="time-ago">{formatTime(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
