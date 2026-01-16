# BTC & ETH Blockchain Indexer MVP

A minimal Bitcoin and Ethereum blockchain indexer built with Node.js, Express, PostgreSQL, and Prisma. The indexer fetches blockchain data from Mempool API (Bitcoin) and Infura API (Ethereum) and stores it in a PostgreSQL database.

## Features

- 📦 **Docker-based Infrastructure**: PostgreSQL, pgAdmin, and Bitcoin Core running in Docker containers
- ₿ **Bitcoin Indexing**: Fetch and store Bitcoin blocks and ALL transactions via dedicated Bitcoin Core node
- ⟠ **Ethereum Indexing**: Fetch and store Ethereum blocks and transactions via Infura API
- 🔄 **Automated Syncing**: Background cron jobs that continuously index latest blocks
- 🔒 **Rate Limiting**: Built-in rate limiting to respect API limits
- 🗄️ **Database**: PostgreSQL with Prisma ORM for type-safe database access
- 🚀 **RESTful API**: Easy-to-use endpoints for indexing and retrieving blockchain data

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Infura API key (already configured in `.env`)

## Setup Instructions

### 1. Start Docker Services

Start PostgreSQL and pgAdmin containers:

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL**: Available at `172.17.0.1:5433`
- **pgAdmin**: Available at `http://172.17.0.1:5051`

### 2. Install Backend Dependencies

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
```

### 3. Set Up Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

When prompted for a migration name, you can use: `init`

### 4. Start the Application

Run the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Health Check

```bash
GET http://localhost:3000/health
```

### Bitcoin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/btc/index/:height` | POST | Index a Bitcoin block by height |
| `/api/btc/block/:height` | GET | Get indexed Bitcoin block by height |
| `/api/btc/transaction/:txid` | GET | Get indexed Bitcoin transaction by txid |
| `/api/btc/latest` | GET | Get latest indexed Bitcoin block |

**Example:**
```bash
# Index Bitcoin block at height 800000
curl -X POST http://localhost:3000/api/btc/index/800000

# Get indexed block
curl http://localhost:3000/api/btc/block/800000
```

### Ethereum API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/eth/index/:number` | POST | Index an Ethereum block by number |
| `/api/eth/block/:number` | GET | Get indexed Ethereum block by number |
| `/api/eth/transaction/:hash` | GET | Get indexed Ethereum transaction by hash |
| `/api/eth/latest` | GET | Get latest indexed Ethereum block |

**Example:**
```bash
# Index Ethereum block at number 18000000
curl -X POST http://localhost:3000/api/eth/index/18000000

# Get indexed block
curl http://localhost:3000/api/eth/block/18000000
```

## pgAdmin Access

Access pgAdmin at `http://172.17.0.1:5051`:

- **Email**: `admin@indexer.com`
- **Password**: `admin123`

To connect to PostgreSQL in pgAdmin:
- **Host**: `postgres` (or `172.17.0.1`)
- **Port**: `5432` (internal container port, external is 5433)
- **Database**: `blockchain_indexer`
- **Username**: `indexer`
- **Password**: `indexer123`

## Rate Limiting

The application implements rate limiting to respect API constraints:

- **Mempool API**: 250 requests per minute
- **Infura API**: 60 requests per minute (conservative limit for 100k/day)
- **General API**: 100 requests per 15 minutes

## Environment Variables

All configuration is in the `.env` file at the root:

```bash
# Infura API
INFURA_RPC_API_KEY=aee926fcf8af49e4b94831f3119fec3b

# Database
POSTGRES_USER=indexer
POSTGRES_PASSWORD=indexer123
POSTGRES_DB=blockchain_indexer
POSTGRES_HOST=172.17.0.1
POSTGRES_PORT=5432

# Server
PORT=3000
NODE_ENV=development
```

## Project Structure

```
btc_eth_indexer/
├── docker-compose.yml          # Docker services configuration
├── .env                         # Environment variables
├── backend/
│   ├── src/
│   │   ├── config/             # Database configuration
│   │   ├── controllers/        # API controllers
│   │   ├── middleware/         # Rate limiting middleware
│   │   ├── routes/             # API routes
│   │   ├── services/           # Blockchain services
│   │   ├── utils/              # Utility functions
│   │   └── index.ts            # Main application
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Development

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

### Build for Production

```bash
npm run build
npm start
```

### Stop Docker Services

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Dedicated Bitcoin Node

The project now uses a dedicated Bitcoin Core node (`bitcoind`) instead of the Mempool API. This allows:
- **Full Transaction Indexing**: Every transaction in every block is indexed.
- **No Rate Limits**: Unlimited local RPC calls.
- **Privacy**: No external API dependency for Bitcoin data.

### Important Note on Syncing
When you first start the `bitcoind` container, it must download the entire Bitcoin blockchain (IBD - Initial Block Download).
- **Status**: Check logs with `docker logs bitcoind -f`
- **Time**: Can take days or weeks depending on hardware.
- **Storage**: Requires ~600GB+ of disk space.

The indexer will automatically start indexing blocks once the node has synced them.

## Automated Block Syncing

The indexer includes background cron jobs that automatically sync the latest blocks:

- **Bitcoin**: Syncs every 5 minutes, indexes up to 10 blocks per run
- **Ethereum**: Syncs every 3 minutes, indexes up to 5 blocks per run (with all transactions)

Cron jobs start automatically when the server starts. Check logs to monitor sync activity:

```bash
# You'll see log entries like:
[INFO] Starting BTC block sync...
[INFO] Latest BTC block height: 875123
[INFO] Syncing 10 BTC blocks from 875114 to 875123
[INFO] Successfully indexed BTC block 875114
[INFO] BTC block sync completed
```

For detailed cron configuration and customization, see [CRON_SERVICE.md](CRON_SERVICE.md).

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **APIs**: Mempool (Bitcoin), Infura (Ethereum)
- **Containerization**: Docker & Docker Compose

## Notes

- The indexer works both on-demand (via API calls) and automatically (via cron jobs)
- Cron jobs continuously sync the latest blocks in the background
- Blocks and transactions are stored in the database after indexing
- Duplicate indexing is prevented - existing data won't be re-indexed
- All blockchain data uses appropriate data types (BigInt for large numbers)
- Rate limiting ensures API quotas are respected

## License

MIT
