# 🚀 MeterFlow Deployment Guide

This guide covers various deployment options for the MeterFlow API billing platform.

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7+
- Docker & Docker Compose (for containerized deployment)
- Stripe account with API keys

## 🐳 Docker Deployment (Recommended)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd meterflow

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values

# Deploy with Docker Compose
chmod +x scripts/deploy.sh
./scripts/deploy.sh docker
```

### Manual Docker Deployment

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included

- **Frontend**: Nginx serving React app (Port 80)
- **Backend**: Node.js API server (Port 5000)
- **MongoDB**: Database (Port 27017)
- **Redis**: Cache & rate limiting (Port 6379)
- **Nginx**: Reverse proxy (Ports 80, 443)

## 🎨 Render Deployment

### Setup

1. Create a Render account
2. Connect your GitHub repository
3. Use the provided `render.yaml` configuration

### Environment Variables

Set these in your Render dashboard:

```bash
NODE_ENV=production
MONGODB_URI=<your-mongodb-connection-string>
REDIS_URL=<your-redis-connection-string>
JWT_SECRET=<your-jwt-secret>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PRO_PRICE_ID=<your-pro-plan-price-id>
STRIPE_ENTERPRISE_PRICE_ID=<your-enterprise-plan-price-id>
```

### Deploy

```bash
./scripts/deploy.sh render
```

## ⚡ Vercel Deployment

### Setup

1. Install Vercel CLI
2. Connect your Vercel account
3. Use the provided `vercel.json` configuration

### Environment Variables

```bash
vercel env add MONGODB_URI
vercel env add REDIS_URL
vercel env add JWT_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRO_PRICE_ID
vercel env add STRIPE_ENTERPRISE_PRICE_ID
```

### Deploy

```bash
./scripts/deploy.sh vercel
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster
- kubectl configured
- Ingress controller (nginx)
- cert-manager (for SSL)

### Deploy

```bash
# Create secrets
kubectl create secret generic meterflow-secrets \
  --from-literal=mongodb-uri="mongodb://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=jwt-secret="your-secret" \
  --from-literal=stripe-secret-key="sk_test_..." \
  --from-literal=stripe-webhook-secret="whsec_..." \
  --from-literal=stripe-pro-price-id="price_..." \
  --from-literal=stripe-enterprise-price-id="price_..."

# Apply deployment
kubectl apply -f kubernetes/deployment.yaml

# Check status
kubectl get pods -l app=meterflow-backend
kubectl get pods -l app=meterflow-frontend
kubectl get ingress
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Backend port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `STRIPE_PRO_PRICE_ID` | Pro plan price ID | Yes |
| `STRIPE_ENTERPRISE_PRICE_ID` | Enterprise plan price ID | Yes |

### Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Create products and prices for:
   - Pro Plan ($29/month)
   - Enterprise Plan ($99/month)
4. Set up webhook endpoints for:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

### Domain Configuration

For production deployments:

1. Point your domains to the deployment
2. Configure SSL certificates
3. Set up CORS for your frontend domain
4. Configure webhook endpoints in Stripe

## 🧪 Testing Before Deployment

```bash
# Run all tests
./scripts/deploy.sh test

# Build for production
./scripts/deploy.sh build
```

## 📊 Monitoring & Logging

### Health Checks

- Backend: `GET /`
- Frontend: `GET /health`

### Logs

- Docker: `docker-compose logs -f [service-name]`
- Render: View in Render dashboard
- Vercel: View in Vercel dashboard
- Kubernetes: `kubectl logs -f deployment/meterflow-backend`

### Metrics

Monitor these key metrics:

- API response time
- Error rates
- Request volume
- Database performance
- Redis memory usage

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Configure appropriate rate limits
4. **Input Validation**: Ensure all inputs are validated
5. **Database Security**: Use MongoDB authentication
6. **Redis Security**: Use Redis password protection

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Verify database is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Check Redis URL format
   - Verify Redis is running
   - Check firewall settings

3. **Stripe Webhook Failures**
   - Verify webhook secret
   - Check webhook URL accessibility
   - Review Stripe event logs

4. **Frontend Build Failures**
   - Check Node.js version
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Debug Commands

```bash
# Docker debug
docker-compose logs backend
docker exec -it meterflow-backend npm run test

# Check service status
curl http://localhost:5000/
curl http://localhost/health

# Database connection test
mongosh "mongodb://username:password@host:port/database"

# Redis connection test
redis-cli -u redis://password@host:port ping
```

## 📞 Support

For deployment issues:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure all services are running
4. Test database and Redis connections
5. Review this troubleshooting section

## 🔄 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: ./scripts/deploy.sh test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: ./scripts/deploy.sh render
        env:
          RENDER_TOKEN: ${{ secrets.RENDER_TOKEN }}
```

---

🎉 **Congratulations!** Your MeterFlow platform is now deployed and ready to handle API billing at scale.
