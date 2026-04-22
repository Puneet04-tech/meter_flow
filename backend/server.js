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

// Gateway logic - explicitly use as a regular route to avoid middleware confusion
const gatewayMiddleware = require('./middleware/gateway');
app.all('/gateway/:apiId/*', gatewayMiddleware);

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
