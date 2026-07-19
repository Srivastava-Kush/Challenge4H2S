import request from 'supertest';
import express from 'express';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import authRoutes from '../../routes/authRoutes.js';
import { User } from '../../models/User.js';
import * as authService from '../../services/authService.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock the User model and auth service
vi.mock('../../models/User.js');
vi.mock('../../services/authService.js');

describe('Auth Routes Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 if email or password is not provided', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }); // missing password

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('Email and password are required');
    });

    it('returns 401 for invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });
});
