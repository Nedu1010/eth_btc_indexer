# Cron Service Configuration

The blockchain indexer includes automated cron jobs that continuously sync the latest blocks from Bitcoin and Ethereum blockchains.

## Overview

Two separate cron services run in the background:
- **Bitcoin Cron**: Syncs every 5 minutes, indexes up to 10 blocks per run
- **Ethereum Cron**: Syncs every 3 minutes, indexes up to 5 blocks per run

## How It Works

### Bitcoin Cron Service
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Process**:
  1. Fetches the latest block height from Mempool API
  2. Compares with the latest indexed block in the database
  3. Indexes up to 10 new blocks per run
  4. Logs all activities and errors
- **Rate Limiting**: Respects 250 req/min Mempool API limit

### Ethereum Cron Service
- **Schedule**: Every 3 minutes (`*/3 * * * *`)
- **Process**:
  1. Fetches the latest block number from Infura API
  2. Compares with the latest indexed block in the database
  3. Indexes up to 5 new blocks per run (including all transactions)
  4. Logs all activities and errors
- **Rate Limiting**: Conservative 60 req/min to stay under 100k/day limit

## Features

✅ **Automatic Startup**: Cron jobs start automatically when the server starts
✅ **Immediate First Run**: Syncs immediately on startup, then follows schedule
✅ **Concurrency Protection**: Prevents overlapping runs with `isRunning` flag
✅ **Error Recovery**: Continues with next block even if one fails
✅ **Full Transaction Indexing**: Ethereum service indexes all transactions in each block
✅ **Comprehensive Logging**: All sync activities are logged for monitoring

## Monitoring

Watch the logs to see cron activity:
```bash
cd backend
npm run dev
```

You'll see entries like:
```
[INFO] 2026-01-16T09:07:48.561Z - Starting ETH block sync...
[INFO] 2026-01-16T09:07:48.561Z - Latest ETH block number: 18000010
[INFO] 2026-01-16T09:07:48.561Z - Syncing 5 ETH blocks from 18000006 to 18000010
[INFO] 2026-01-16T09:07:48.561Z - Successfully indexed ETH block 18000006
[INFO] 2026-01-16T09:07:48.561Z - ETH block sync completed
```

## Customization

To change the cron schedule, edit the cron expressions in:
- `backend/src/services/btc.cron.ts`
- `backend/src/services/eth.cron.ts`

### Cron Expression Format
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `*/1 * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour at minute 0
- `0 0 * * *` - Every day at midnight

## Manual Sync

You can also manually trigger a sync by calling the service methods:

```typescript
import btcCronService from './services/btc.cron';
import ethCronService from './services/eth.cron';

// Manually sync Bitcoin blocks
await btcCronService.syncLatestBlocks();

// Manually sync Ethereum blocks
await ethCronService.syncLatestBlocks();
```

## Disabling Cron Jobs

To disable automatic syncing, comment out the cron job start calls in `src/index.ts`:

```typescript
// btcCronService.startCronJob();
// ethCronService.startCronJob();
```

## Best Practices

1. **Monitor Logs**: Watch for sync errors and API rate limit warnings
2. **Adjust Frequency**: If you hit rate limits, reduce sync frequency
3. **Batch Size**: Adjust blocks-per-run based on your needs and rate limits
4. **Database Backups**: Regular backups recommended as data grows
5. **Disk Space**: Monitor database size as blocks accumulate

## Troubleshooting

### Cron Not Running
- Check server logs for startup errors
- Verify cron expressions are valid
- Ensure database connection is working

### Rate Limit Errors
- Reduce sync frequency
- Decrease blocks-per-run limit
- Check your API key quotas

### Missing Blocks
- Check for errors in logs during specific time periods
- Manually index missed blocks using POST endpoints
- Verify network connectivity to blockchain APIs
