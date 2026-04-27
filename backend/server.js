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

// Gateway logic - use regular expression directly for Express 5.x
const gatewayMiddleware = require('./middleware/gateway');
app.all(/^\/gateway\/([^\/]+)\/(.*)/, (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
