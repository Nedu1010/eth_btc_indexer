import { Router } from 'express';
import btcController from '../controllers/btc.controller';

const router = Router();

router.get('/block/:height', btcController.getBlock);
router.get('/transaction/:txid', btcController.getTransaction);
router.get('/latest', btcController.getLatestBlock);
router.get('/recent-blocks', btcController.getRecentBlocks);
router.get('/recent-transactions', btcController.getRecentTransactions);

export default router;
