import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../config/firebase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'stadiumiq_jwt_secret_2026_worldcup';

// JWT Auth middleware (for protected routes)
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }
  
  const token = authHeader.slice(7);
  
  try {
    // 1. Try resolving as a custom JWT
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (jwtError) {
    // 2. If it fails, check if it's a Firebase token
    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        // Map the decoded Firebase token to match our custom User format
        req.user = {
          id: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role || 'fan', // Default to fan if no custom claims exist
          name: decodedToken.name || 'Firebase User',
          authProvider: 'google'
        };
        return next();
      } catch (firebaseError) {
        // Both verification attempts failed
        console.error('Firebase Auth verification failed:', firebaseError);
      }
    }
    
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

export default router;
