import { Router } from 'express';
import ethController from '../controllers/eth.controller';

const router = Router();

router.get('/blocks', ethController.getBlocks);
router.get('/transactions', ethController.getTransactions);
router.get('/block/:number', ethController.getBlock);
router.get('/transaction/:hash', ethController.getTransaction);
router.get('/latest', ethController.getLatestBlock);
router.get('/recent-blocks', ethController.getRecentBlocks);
router.get('/recent-transactions', ethController.getRecentTransactions);
router.get('/accounts', ethController.getAccounts);
router.get('/account/:address', ethController.getAccountDetails);

export default router;
