const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/mems', require('./routes/apiRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Route check middleware (moved to end)
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - Route check`);
  next();
});

// Cache busting for route changes
delete require.cache[require.resolve('./routes/apiRoutes')];

// Gateway logic - use regular expression directly for Express 5.x
const gatewayMiddleware = require('./middleware/gateway');
app.all(/^\/gateway\/([a-f0-9]{24})\/(.*)/, (req, res) => {
  req.params.apiId = req.params[0];
  req.params.apiPath = req.params[1];
  gatewayMiddleware(req, res);
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🚀 MongoDB Connected (Cyberpunk Grid Online)'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'MeterFlow API - System Status: Optimal', status: 'Online' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
