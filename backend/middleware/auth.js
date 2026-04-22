const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.header('x-auth-token');
  
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] Decoded token:', JSON.stringify(decoded));
    
    // Handle both old format (id) and new format (user.id)
    if (decoded.user && decoded.user.id) {
      req.user = decoded.user;
    } else if (decoded.id) {
      req.user = { id: decoded.id };
    } else {
      console.error('[AUTH] Invalid token format - no id found');
      return res.status(401).json({ error: 'Token format invalid' });
    }
    
    console.log('[AUTH] Set req.user:', req.user);
    next();
  } catch (err) {
    console.error('[AUTH] Verification failed:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
