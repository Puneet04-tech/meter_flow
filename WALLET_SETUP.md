# Wallet & Stripe Payment System

## Overview
MeterFlow now includes a wallet system where users must have sufficient balance to upgrade their plans. All payments are processed securely through Stripe.

## Setup

### 1. Stripe API Keys
Get your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com):
- **Secret Key**: Used by backend for payment processing
- **Public Key**: Used by frontend for payment UI

### 2. Backend Configuration
In `/backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

### 3. Frontend Configuration
In `/frontend/.env.local`:
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
REACT_APP_API_URL=http://localhost:5000/api
```

## User Flow

### 1. Wallet TopUp
1. Navigate to **Billing** page
2. Click **"Top Up Wallet"** button
3. Enter amount ($5 - $10,000)
4. Enter card details in payment form
5. Click **"Pay $XX.XX"**
6. Stripe processes payment securely
7. Funds added to wallet instantly

### 2. Plan Upgrade
1. On **Billing** page, view three plans:
   - **Free Plan**: $0/month (always available)
   - **Pro Plan**: $29/month (requires $29 wallet balance)
   - **Enterprise**: Custom (contact sales)

2. Click upgrade button for desired plan
3. System checks if wallet has sufficient balance:
   - ✅ **Sufficient Balance**: Plan upgrades immediately, balance deducted
   - ❌ **Insufficient Balance**: Shows how much more needed, prompts to top up

### 3. Transaction History
- View all wallet transactions on **Billing** page
- See topup deposits and plan upgrade deductions
- Each transaction shows:
  - Type (Topup / Deduction)
  - Amount
  - Reason (stripe_payment / plan_upgrade_to_pro)
  - Balance before/after
  - Status (pending / completed / failed)

## API Endpoints

### Wallet Management
```
GET /api/billing/wallet
  Returns: { balance: 50.00, transactions: [...] }

POST /api/billing/wallet/topup-intent
  Body: { amount: 100 }
  Returns: { clientSecret, paymentIntentId, amount, currency }

POST /api/billing/wallet/confirm-topup
  Body: { paymentIntentId, amount }
  Returns: { success: true, newBalance, transaction }

GET /api/billing/wallet/transactions?limit=50&page=1
  Returns: { transactions: [...], pagination: {...} }
```

### Plan Upgrade
```
POST /api/billing/upgrade
  Body: { plan: "pro" | "enterprise" | "free" }
  Returns: { success: true, cost: 29, newBalance, user }
  
  Errors:
  - 402: Insufficient wallet balance (shows required vs current)
  - 400: Invalid plan type
```

## Pricing

| Plan | Price | Requests/Month | Features |
|------|-------|---|---|
| Free | $0 | 1,000 | Basic analytics, pay for overages |
| Pro | $29 | 50,000 | Advanced analytics, priority support, webhooks |
| Enterprise | Custom | Unlimited | Dedicated support, custom integrations, SLA |

### Overage Pricing
- Free tier: First 1,000 requests/month included
- Overages: $0.10 per 100 requests

## Development Testing

### Test Card Numbers (Stripe)
```
4242 4242 4242 4242  - Visa (Success)
5555 5555 5555 4444  - Mastercard (Success)
4000 0025 0000 3155  - Visa (Requires 3D Secure)
```
Use any future expiry date and any 3-digit CVC for testing.

### Test Flow
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Register account at http://localhost:3000
4. Go to Billing page
5. Click "Top Up Wallet"
6. Use test card 4242 4242 4242 4242
7. Enter: Expiry 12/25, CVC 123
8. Click "Pay $10.00"
9. Verify wallet shows $10.00
10. Try upgrading to Pro ($29 shows "Top Up Needed")
11. Top up with $25 more
12. Upgrade to Pro - shows $6.00 remaining

## Security

✅ **PCI Compliance**
- Stripe Element handles card data securely
- Payment details never stored on backend
- Only Stripe Payment Intent ID stored

✅ **Authentication**
- All wallet/billing endpoints require JWT token
- User can only access own wallet

✅ **Transaction Audit**
- All topups/deductions logged in WalletTransaction
- Cannot modify after creation
- Balance history for dispute resolution

## Database Schema

### User Model
```javascript
{
  email: String,
  password: String (hashed),
  plan: String (free|pro|enterprise),
  walletBalance: Number,  // NEW
  stripeCustomerId: String,  // NEW
  createdAt: Date
}
```

### WalletTransaction Model
```javascript
{
  user: ObjectId,
  type: String (topup|deduction|refund),
  amount: Number,
  reason: String,
  stripePaymentId: String,
  balanceBefore: Number,
  balanceAfter: Number,
  status: String (pending|completed|failed),
  metadata: Mixed,
  createdAt: Date
}
```

## Troubleshooting

### "Insufficient wallet balance" error
→ User needs to top up wallet first via "Top Up Wallet" button

### "Payment failed" during topup
→ Check card details:
  - Card number is valid
  - Expiry date hasn't passed
  - CVC is correct (3-4 digits)
  - Card isn't declined in Stripe dashboard

### Stripe key errors
→ Verify environment variables set correctly:
  - Backend: `STRIPE_SECRET_KEY` starts with `sk_`
  - Frontend: `REACT_APP_STRIPE_PUBLIC_KEY` starts with `pk_`

### Balance not updating
→ Check MongoDB is running and WalletTransaction saved successfully

## Future Enhancements
- [ ] Auto-topup when balance below threshold
- [ ] Refund processing
- [ ] Invoice generation
- [ ] Multiple payment methods (Apple Pay, Google Pay)
- [ ] Wallet balance history graph
- [ ] Billing alerts via email
