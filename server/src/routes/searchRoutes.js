import express from 'express';
import { searchAll, getNearby, getSearchSuggestions } from '../controllers/searchController.js';

const router = express.Router();

router.get('/', searchAll);
router.get('/nearby', getNearby);
router.get('/suggestions', getSearchSuggestions);

export default router;
