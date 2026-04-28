import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, TrendingUp, Check, Wallet, ArrowDown } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import API from '../api';

const Billing: React.FC = () => {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10);
  const [processing, setProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    fetchBilling();
    fetchUserProfile();
    fetchWallet();
  }, []);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await API.get('/billing/calculate');
      setBilling(res.data);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    }
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/billing/profile');
      setUserProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await API.get('/billing/wallet');
      setWallet(res.data);
    } catch (err) {
      console.error("Failed to fetch wallet", err);
    }
  };

  const planCosts = {
    free: 0,
    pro: 29,
    enterprise: 0
  };

  const handleUpgradePlan = async (planType: string) => {
    const cost = planCosts[planType as keyof typeof planCosts];
    
    // Check if user has sufficient balance
    if (cost > 0 && (wallet?.balance || 0) < cost) {
      alert(`❌ Insufficient wallet balance!\nRequired: $${cost}\nCurrent: $${(wallet?.balance || 0).toFixed(2)}\n\nPlease top up your wallet first.`);
      setShowTopup(true);
      return;
    }

    setUpgrading(true);
    try {
      const res = await API.post('/billing/upgrade', { plan: planType });
      alert(`✅ Upgraded to ${planType} plan!${cost > 0 ? ` ($${cost} deducted from wallet)` : ''}`);
      fetchUserProfile();
      fetchWallet();
      fetchBilling();
    } catch (err: any) {
      alert(`❌ Upgrade failed: ${err.response?.data?.error || err.message}`);
    }
    setUpgrading(false);
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    setProcessing(true);

    try {
      // Step 1: Create payment intent
      const intentRes = await API.post('/billing/wallet/topup-intent', { 
        amount: topupAmount 
      });

      const { clientSecret } = intentRes.data;

      // Step 2: Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {}
        }
      });

      if (result.error) {
        alert(`❌ Payment failed: ${result.error.message}`);
      } else if (result.paymentIntent?.status === 'succeeded') {
        // Step 3: Confirm topup on backend
        await API.post('/billing/wallet/confirm-topup', {
          paymentIntentId: result.paymentIntent.id,
          amount: topupAmount
        });

        alert(`✅ Successfully added $${topupAmount} to wallet!`);
        setTopupAmount(10);
        setShowTopup(false);
        fetchWallet();
      }
    } catch (err: any) {
      alert(`❌ Topup failed: ${err.response?.data?.error || err.message}`);
    }
    setProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-2 bg-cyber-red rounded-full animate-ping" />
          <span className="text-cyber-red text-xs font-black tracking-[0.3em] uppercase">System_Active</span>
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter italic">
          Billing<span className="text-cyber-red">.</span>exe
        </h2>
      </div>

      {/* Wallet Card */}
      <section className="cyber-card border-2 border-blue-500/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-cyber-muted text-xs uppercase font-black tracking-widest mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              Wallet_Balance
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black italic text-blue-400">${(wallet?.balance || 0).toFixed(2)}</span>
              <span className="text-cyber-muted text-lg">USD</span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTopup(!showTopup)}
            className={`px-6 py-3 rounded font-black flex items-center gap-2 transition-all ${
              showTopup
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            Top Up Wallet
          </motion.button>
        </div>

        {/* Topup Section */}
        {showTopup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            <h3 className="text-lg font-bold mb-4">Add Funds to Wallet</h3>
            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Amount (USD)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    step="5"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(parseFloat(e.target.value))}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded text-white"
                    placeholder="Enter amount"
                  />
                  <span className="px-4 py-2 bg-white/10 rounded text-white/50">USD</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Minimum: $5 | Maximum: $10,000</p>
              </div>

              <div className="bg-white/5 border border-white/20 rounded p-4">
                <label className="block text-sm mb-3">Card Details</label>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '14px',
                        color: '#ffffff',
                        '::placeholder': {
                          color: '#ffffff',
                          opacity: 0.5
                        }
                      },
                      invalid: {
                        color: '#fa755a'
                      }
                    }
                  }}
                  className="p-2"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/50 rounded p-3">
                <p className="text-sm font-bold">
                  Total: <span className="text-blue-400">${topupAmount.toFixed(2)}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!stripe || processing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-black disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Pay $${topupAmount.toFixed(2)}`}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowTopup(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded font-black"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </section>
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Side - Amount Due */}
          <div>
            <div className="text-cyber-muted text-xs uppercase font-black tracking-widest mb-4">Current_Bill</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-6xl font-black italic text-cyber-red">${billing?.amount || '0.00'}</span>
              <span className="text-cyber-muted text-lg">{billing?.currency}</span>
            </div>
            <p className="text-cyber-muted text-sm">
              {billing?.billableRequests} billable requests beyond {billing?.freeTier} free tier
            </p>
          </div>

          {/* Right Side - Key Stats */}
          <div className="space-y-4">
            <div className="cyber-card border-l-4 border-l-cyber-red">
              <div className="text-cyber-muted text-xs uppercase font-black tracking-widest mb-2">Total_Requests</div>
              <div className="text-4xl font-black italic">{billing?.totalRequests || 0}</div>
            </div>
            <div className="cyber-card border-l-4 border-l-yellow-500">
              <div className="text-cyber-muted text-xs uppercase font-black tracking-widest mb-2">Billable_Requests</div>
              <div className="text-4xl font-black italic text-yellow-500">{billing?.billableRequests || 0}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8" />

        {/* Usage Breakdown */}
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-cyber-red" size={20} />
            Usage_Breakdown
          </h3>
          <div className="space-y-4">
            {/* Free Tier */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Free_Tier</span>
                <span className="text-green-400 font-black">{billing?.freeTier} requests</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{width: '100%'}} />
              </div>
            </div>

            {/* Billable */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Billable_Usage</span>
                <span className="text-cyber-red font-black">{billing?.billableRequests || 0} requests @ $0.1/100</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-red rounded-full" style={{width: Math.min((billing?.billableRequests || 0) / (billing?.totalRequests || 1) * 100, 100) + '%'}} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Info */}
      <section className="cyber-card">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="text-yellow-500" size={20} />
          Pricing_Structure
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between pb-2 border-b border-white/10">
            <span>Free Tier</span>
            <span className="font-black">1,000 requests/month</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-white/10">
            <span>Overage Rate</span>
            <span className="font-black">$0.10 per 100 requests</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-white/10">
            <span>Billing Cycle</span>
            <span className="font-black">Monthly</span>
          </div>
          <div className="flex justify-between">
            <span>Current Plan</span>
            <span className="font-black text-cyber-red uppercase">{billing?.status}</span>
          </div>
        </div>
      </section>

      {/* Plan Upgrade Section */}
      <section className="space-y-4">
        <h3 className="text-2xl font-bold mb-6">Upgrade_Your_Plan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`cyber-card border-2 ${userProfile?.plan === 'free' ? 'border-cyber-red' : 'border-white/10'} p-6`}
          >
            <div className="mb-4">
              <h4 className="text-xl font-black mb-2">Free Plan</h4>
              <div className="text-3xl font-black text-green-400">$0<span className="text-sm">/month</span></div>
            </div>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>1,000 requests/month</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Pay for overages</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Basic analytics</span>
              </div>
            </div>
            <button
              disabled={userProfile?.plan === 'free'}
              className="w-full py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              {userProfile?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`cyber-card border-2 ${userProfile?.plan === 'pro' ? 'border-cyber-red' : 'border-white/10'} p-6 relative`}
          >
            <div className="absolute top-4 right-4 bg-cyber-red text-white px-3 py-1 rounded text-xs font-black">
              POPULAR
            </div>
            <div className="mb-4">
              <h4 className="text-xl font-black mb-2">Pro Plan</h4>
              <div className="text-3xl font-black text-cyber-red">$29<span className="text-sm">/month</span></div>
            </div>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyber-red" />
                <span>50,000 requests/month</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyber-red" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyber-red" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyber-red" />
                <span>Webhooks & integrations</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUpgradePlan('pro')}
              disabled={userProfile?.plan === 'pro' || upgrading}
              className={`w-full py-2 rounded font-black transition-all ${
                userProfile?.plan === 'pro'
                  ? 'bg-cyber-red/30 text-white cursor-default'
                  : (wallet?.balance || 0) >= 29
                  ? 'bg-cyber-red hover:bg-red-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              } disabled:opacity-50`}
            >
              {userProfile?.plan === 'pro'
                ? 'Current Plan'
                : (wallet?.balance || 0) >= 29
                ? `Upgrade ($29)`
                : `Top Up Needed ($29)`}
            </motion.button>
            {(wallet?.balance || 0) < 29 && userProfile?.plan !== 'pro' && (
              <p className="text-xs text-yellow-400 mt-2">
                Balance: ${(wallet?.balance || 0).toFixed(2)} | Need: ${(29 - (wallet?.balance || 0)).toFixed(2)} more
              </p>
            )}
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`cyber-card border-2 ${userProfile?.plan === 'enterprise' ? 'border-cyber-red' : 'border-white/10'} p-6`}
          >
            <div className="mb-4">
              <h4 className="text-xl font-black mb-2">Enterprise</h4>
              <div className="text-3xl font-black text-yellow-400">Custom<span className="text-sm">/month</span></div>
            </div>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-yellow-400" />
                <span>Unlimited requests</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-yellow-400" />
                <span>Dedicated support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-yellow-400" />
                <span>Custom integrations</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-yellow-400" />
                <span>SLA guarantee</span>
              </div>
            </div>
            <button
              onClick={() => handleUpgradePlan('enterprise')}
              disabled={upgrading || userProfile?.plan === 'enterprise'}
              className="w-full py-2 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-700 disabled:opacity-50"
            >
              {userProfile?.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Invoices Section */}
      <section className="cyber-card">
        <h3 className="text-lg font-bold mb-4">Recent_Invoices</h3>
        <div className="text-center py-8 text-cyber-muted">
          No invoices yet. Invoices will appear here as you exceed free tier.
        </div>
      </section>
    </motion.div>
  );
};

export default Billing;
