import { Router } from 'express';
import btcController from '../controllers/btc.controller';
import { mempoolLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiter to all BTC routes
router.use(mempoolLimiter);

// Index a block by height
router.post('/index/:height', (req, res) => btcController.indexBlock(req, res));

// Get a block by height
router.get('/block/:height', (req, res) => btcController.getBlock(req, res));

// Get a transaction by txid
router.get('/transaction/:txid', (req, res) => btcController.getTransaction(req, res));

// Get the latest indexed block
router.get('/latest', (req, res) => btcController.getLatestBlock(req, res));

export default router;
