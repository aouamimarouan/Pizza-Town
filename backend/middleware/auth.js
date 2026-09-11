import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  let token = req.cookies?.token;

  // Support Authorization: Bearer <token> (crucial for mobile Safari/WebKit cross-site cookie restrictions)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};
