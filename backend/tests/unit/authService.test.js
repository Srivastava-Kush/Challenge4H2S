import { describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'test-secret';

vi.mock('jsonwebtoken', () => ({ default: { sign: vi.fn(() => 'signed-token') } }));
import jwt from 'jsonwebtoken';
import { buildUserProfile, signToken } from '../../services/authService.js';

describe('authService', () => {
  it('signs a seven-day token from a Mongo user', () => {
    expect(signToken({ _id: 'user-1', email: 'fan@example.com', role: 'fan', name: 'Fan' })).toBe('signed-token');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user-1', email: 'fan@example.com', role: 'fan', name: 'Fan' },
      expect.any(String),
      { expiresIn: '7d' },
    );
  });

  it('normalizes profiles and uses mongo as the default provider', () => {
    expect(buildUserProfile({ id: 7, name: 'Fan', email: 'fan@example.com', role: 'fan' })).toEqual({
      id: '7', name: 'Fan', email: 'fan@example.com', role: 'fan', authProvider: 'mongo',
    });
    expect(buildUserProfile({ _id: 'x', name: 'Ops', email: 'ops@example.com', role: 'ops', authProvider: 'firebase' }).authProvider).toBe('firebase');
  });
});
