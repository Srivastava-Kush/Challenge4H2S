import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { loadKnowledgeBase } from './services/ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ─── Security Hardening (OWASP Top 10) ───────────────────────────────────────
// A05: Security Misconfiguration - Enforce secure HTTP headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      frameSrc: ["'self'", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// A04: Insecure Design - Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use(cors());
app.use(express.json({ limit: '1mb' })); // A03: Injection prevention (limit payload size)

// Log Hugging Face API status
if (process.env.HF_TOKEN) {
  console.log(`🤖 Hugging Face AI enabled — model: ${process.env.CHAT_MODEL || 'Qwen/Qwen2.5-72B-Instruct'}`);
} else {
  console.warn('⚠️  HF_TOKEN not set — chatbot will run in keyword-fallback mode.');
}

// Initialize MongoDB and Services
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected:', MONGO_URI);
    })
    .catch(err => console.warn('⚠️  MongoDB not available — auth endpoints will use fallback mode:', err.message));
} else {
  console.warn('⚠️  MONGO_URI not set — MongoDB not available (auth endpoints will use fallback mode).');
}

// Load RAG knowledge base (async — embeddings generated after DB connects)
loadKnowledgeBase().catch(err => console.error('RAG init error:', err.message));

// Mount API routes
app.use('/api', apiRoutes);

// Render Deployment / Production static serving
// If the backend runs in production on Render, it will serve the built frontend from ../frontend/dist
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🏟️  StadiumIQ Backend Server running on port ${PORT}`);
  console.log(`   ➜ API mounted at /api`);
});
