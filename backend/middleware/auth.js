const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
    let userId;
    if (decoded.user && decoded.user.id) {
      userId = decoded.user.id;
    } else if (decoded.id) {
      userId = decoded.id;
    } else {
      console.error('[AUTH] Invalid token format - no id found');
      return res.status(401).json({ error: 'Token format invalid' });
    }
    
    // Convert string ID to ObjectId for database queries
    req.user = { 
      id: new mongoose.Types.ObjectId(userId) 
    };
    
    console.log('[AUTH] Set req.user:', req.user);
    next();
  } catch (err) {
    console.error('[AUTH] Verification failed:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
