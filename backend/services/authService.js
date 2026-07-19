import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stadiumiq_jwt_secret_2026_worldcup';

export function signToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function buildUserProfile(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider || 'mongo'
  };
}
