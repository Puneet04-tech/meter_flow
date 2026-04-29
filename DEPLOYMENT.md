# MeterFlow Deployment Guide

This guide covers deployment to Netlify (frontend) and Render (backend + database + frontend).

## 🚀 Quick Deployment Options

### Option 1: Render (All-in-One)
- **Backend**: Node.js API server
- **Frontend**: React SPA
- **Database**: MongoDB
- **Cache**: Redis
- **Status**: Recommended for full-featured deployment

### Option 2: Netlify + Render
- **Frontend**: Netlify (static hosting)
- **Backend**: Render (Node.js)
- **Database**: MongoDB (Render)
- **Cache**: Redis (Render)
- **Status**: Best for performance and scalability

---

## 🛠️ Render Deployment

### Prerequisites
- Render account (free tier available)
- GitHub repository with your code
- Stripe account (for payments)

### Step 1: Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `meterflow` repository

### Step 2: Backend Configuration
```yaml
# Use the provided render.yaml file
# Render will automatically detect and configure:
- Backend API server
- Frontend static site
- MongoDB database
- Redis cache
```

### Step 3: Environment Variables
Set these in Render Dashboard:
```bash
# Backend Environment Variables
NODE_ENV=production
PORT=5000
JWT_SECRET=your-jwt-secret-here

# Database
MONGODB_URI=auto-generated-by-render

# Cache
REDIS_URL=auto-generated-by-render

# Stripe (Required for billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# CORS
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### Step 4: Frontend Configuration
```bash
# Frontend Environment Variables
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will build and deploy automatically
3. Monitor deployment logs for any issues

---

## 🌐 Netlify Deployment

### Prerequisites
- Netlify account (free tier available)
- GitHub repository with your code
- Render backend already deployed

### Step 1: Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Select the `meterflow` repository

### Step 2: Build Settings
```bash
# Build Settings
Base directory: frontend
Build command: npm run build
Publish directory: frontend/build
```

### Step 3: Environment Variables
```bash
# Netlify Environment Variables
REACT_APP_API_URL=https://your-backend-url.onrender.com
NODE_VERSION=18
```

### Step 4: Deploy
1. Click "Deploy site"
2. Netlify will build and deploy automatically
3. Your site will be live at `https://your-site-name.netlify.app`

---

## 🔧 Configuration Files

### render.yaml
```yaml
# Complete Render configuration
# Includes backend, frontend, database, and Redis
# Auto-configures environment variables
```

### netlify.toml
```toml
# Complete Netlify configuration
# Includes build settings, redirects, headers
# Optimized for performance and security
```

---

## 📊 Service URLs

### Render URLs
- **Backend**: `https://meterflow-backend.onrender.com`
- **Frontend**: `https://meterflow-frontend.onrender.com`
- **Database**: Internal (not accessible publicly)
- **Redis**: Internal (not accessible publicly)

### Netlify URLs
- **Frontend**: `https://your-site-name.netlify.app`
- **Backend**: Same as Render backend URL

---

## 🔄 API Configuration

### Backend CORS Settings
```javascript
// In backend/server.js
app.use(cors({
  origin: [
    'https://meterflow-frontend.onrender.com',
    'https://your-site-name.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### Frontend API Configuration
```javascript
// In frontend/src/api.ts
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});
```

---

## 💳 Payment Setup

### Stripe Configuration
1. Create Stripe account
2. Get API keys from Stripe Dashboard
3. Create products and prices
4. Set up webhook endpoint
5. Add environment variables to Render

### Webhook Endpoint
```
https://your-backend-url.onrender.com/api/webhooks/stripe
```

---

## 🧪 Testing Deployment

### Health Checks
```bash
# Backend health check
curl https://your-backend-url.onrender.com/

# Frontend accessibility
curl https://your-frontend-url.onrender.com/
```

### API Testing
```bash
# Test API endpoints
curl https://your-backend-url.onrender.com/api/auth/register
curl https://your-backend-url.onrender.com/api/billing/plans
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Errors
```bash
# Check CORS origin settings
# Ensure frontend URL is in backend CORS whitelist
```

#### 2. Environment Variables
```bash
# Verify all required variables are set
# Check Render dashboard for missing variables
```

#### 3. Database Connection
```bash
# Check MongoDB connection string
# Verify database is running
# Check logs for connection errors
```

#### 4. Redis Connection
```bash
# Check Redis connection string
# Verify Redis is running
# Check logs for Redis errors
```

#### 5. Build Failures
```bash
# Check build logs in Render/Netlify
# Verify package.json scripts
# Check for missing dependencies
```

### Debug Commands
```bash
# Check backend logs
curl https://your-backend-url.onrender.com/

# Check frontend build
# View build logs in Netlify dashboard

# Test API connectivity
curl -X POST https://your-backend-url.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🚀 Production Optimizations

### Backend Optimizations
- Enable gzip compression
- Implement proper logging
- Set up monitoring
- Configure rate limiting
- Add health checks

### Frontend Optimizations
- Enable code splitting
- Optimize images
- Implement lazy loading
- Add service worker
- Configure caching

### Database Optimizations
- Create proper indexes
- Implement connection pooling
- Set up backups
- Monitor performance
- Optimize queries

---

## 📈 Monitoring

### Render Monitoring
- Built-in metrics dashboard
- Error logs
- Performance monitoring
- Health checks

### Netlify Monitoring
- Build logs
- Function logs
- Analytics
- Performance metrics

### Recommended Tools
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user analytics
- Uptime monitoring

---

## 🔄 Updates and Maintenance

### Continuous Deployment
- GitHub → Render/Netlify auto-deploy
- Branch-based deployments
- Pull request previews
- Rollback capabilities

### Maintenance Tasks
- Regular dependency updates
- Database backups
- SSL certificate renewal
- Performance monitoring
- Security updates

---

## 🎯 Next Steps

1. **Deploy to Render** using `render.yaml`
2. **Deploy frontend to Netlify** using `netlify.toml`
3. **Configure Stripe** for payments
4. **Set up monitoring** and alerts
5. **Test all features** in production
6. **Monitor performance** and optimize

---

## 📞 Support

### Documentation
- [Render Docs](https://render.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Stripe Docs](https://stripe.com/docs)

### Community
- Render Discord
- Netlify Community
- Stack Overflow

---

**🚀 Your MeterFlow application is ready for production deployment!**
