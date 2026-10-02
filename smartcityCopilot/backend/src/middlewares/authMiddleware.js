const jwt = require('jsonwebtoken');

// Verifies the JWT from the Authorization header and attaches the payload to req.user
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
  }
}

// Factory: restricts a route to the given roles, e.g. authorize(['CITY_ADMIN', 'DEPT_MANAGER'])
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
}

// Decodes the JWT if present but never blocks the request - lets public routes vary behavior for logged-in users
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Ignore invalid/expired tokens on optional routes
    }
  }

  next();
}

// Shorthand for routes restricted to city administrators
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'CITY_ADMIN') {
    return res.status(403).json({ success: false, message: 'City administrator access required' });
  }
  next();
}

// Shorthand for routes restricted to department managers or city administrators
function isManagerOrAdmin(req, res, next) {
  if (!req.user || !['DEPT_MANAGER', 'CITY_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Department manager or admin access required' });
  }
  next();
}

module.exports = { authenticate, authorize, optionalAuth, isAdmin, isManagerOrAdmin };
