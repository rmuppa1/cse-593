const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Middleware factory to authorize based on roles
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

/**
 * Specialized middleware for CITY_ADMIN role
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'CITY_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

/**
 * Specialized middleware for DEPT_MANAGER or CITY_ADMIN role
 */
const isManagerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'DEPT_MANAGER' || req.user.role === 'CITY_ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Manager or Admin role required' });
  }
};

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isManagerOrAdmin
};
