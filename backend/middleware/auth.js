const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = String(process.env.JWT_SECRET || '');
if (JWT_SECRET.length < 32 || /replace|change|example|generate|secret-key-2024/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters.');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
