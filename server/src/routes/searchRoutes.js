import express from 'express';
import { searchAll, getNearby } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchAll);
router.get('/nearby', getNearby);

export default router;
