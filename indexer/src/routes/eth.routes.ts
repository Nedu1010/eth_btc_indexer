import { Router } from 'express';
import ethController from '../controllers/eth.controller';
import { infuraLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiter to all ETH routes
router.use(infuraLimiter);

// Index a block by number
router.post('/index/:number', (req, res) => ethController.indexBlock(req, res));

// Get a block by number
router.get('/block/:number', (req, res) => ethController.getBlock(req, res));

// Get a transaction by hash
router.get('/transaction/:hash', (req, res) => ethController.getTransaction(req, res));

// Get the latest indexed block
router.get('/latest', (req, res) => ethController.getLatestBlock(req, res));

export default router;
