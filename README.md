# 🚀 MeterFlow – Usage-Based API Billing Platform

MeterFlow is an industrial-grade API gateway and monetization system designed for SaaS platforms. It intercepts API requests, applies real-time rate limiting via Redis, logs usage for audit and billing, and provides a futuristic dashboard for analytics.

## 🧱 Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Advanced**: Redis (Rate Limiting), BullMQ (Background Jobs), Axios (Proxy)
- **Design**: Cyberpunk Professional Dark Theme (Deep Red & Charcoal)

## ⚙️ Core Modules
1. **API Gateway**: Intercepts requests, validates keys, forwards to target API.
2. **Usage Tracking**: High-performance logging of status, latency, and endpoints.
3. **Key Management**: Secure generation and revocation of API keys.
4. **Billing Engine**: Dynamic tier-based pricing calculations.
5. **Dashboard**: Real-time analytics and traffic visualization.

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- MongoDB
- Redis

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🧠 Gateway Logic
Requests are routed through:
`GET /gateway/:apiId/your-endpoint`
Header: `x-api-key: your_key_here`

The gateway performs:
1. **Identity Check**: Verifies key status in cache/DB.
2. **Rate Limit**: Uses Redis `INCR` and `EXPIRE` for sliding window limiting (100 req/min).
3. **Proxy**: Forwards to the target `baseUrl` configured for the API.
4. **Audit**: Non-blocking log persistence for billing calculations.
