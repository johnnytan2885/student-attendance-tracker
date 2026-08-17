const crypto = require('crypto');
const sessions = new Map();

function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { adminId, createdAt: Date.now() });
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function getSession(token) {
  return sessions.get(token);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.adminId = session.adminId;
  req.sessionToken = token;
  next();
}

module.exports = { createSession, destroySession, requireAuth };