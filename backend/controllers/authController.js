import { User } from '../models/User.js';
import { signToken, buildUserProfile } from '../services/authService.js';

export const register = async (req, res) => {
  const { name, email, password, role = 'fan' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  // Operations and volunteer identities are provisioned by administrators.
  if (role !== 'fan') {
    return res.status(403).json({ error: 'Operations and volunteer accounts are provisioned by an administrator.' });
  }

  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user = await new User({ name, email, password, role }).save();
    const token = signToken(user);
    return res.status(201).json({ token, user: buildUserProfile(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { email, password, expectedRole } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ error: `This account does not have ${expectedRole} access.` });
    }

    const token = signToken(user);
    return res.json({ token, user: buildUserProfile(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getMe = (req, res) => {
  res.json({ user: req.user });
};
