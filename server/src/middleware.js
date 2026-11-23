import jwt from 'jsonwebtoken';
import { User } from './models.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email role team');
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user; next();
  } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
}
export const managerOnly = (req, res, next) => req.user.role === 'manager' ? next() : res.status(403).json({ error: 'Manager access required' });
