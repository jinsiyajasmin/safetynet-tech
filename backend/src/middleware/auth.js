// src/middleware/auth.js
const jwt = require('jsonwebtoken');

exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, clientId }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Not authenticated' });

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });

  next();
};
