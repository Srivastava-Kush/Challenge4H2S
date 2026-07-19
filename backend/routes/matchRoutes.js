import express from 'express';
import { getMatches, updateScore } from '../controllers/matchController.js';
import { requireAuth } from '../routes/authRoutes.js';

const router = express.Router();

router.get('/', getMatches);
router.post('/:id/score', requireAuth, updateScore);

export default router;
