import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'stadiumiq_jwt_secret_2026_worldcup';

// JWT Auth middleware (for protected routes)
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }
  try {
    const token = authHeader.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

export default router;
