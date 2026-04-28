import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, TrendingUp, Check } from 'lucide-react';
import API from '../api';

const Billing: React.FC = () => {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchBilling();
    fetchUserProfile();
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

  const handleUpgradePlan = async (planType: string) => {
    setUpgrading(true);
    try {
      await API.post('/billing/upgrade', { plan: planType });
      alert(`✅ Upgraded to ${planType} plan!`);
      fetchUserProfile();
      fetchBilling();
    } catch (err: any) {
      alert(`❌ Upgrade failed: ${err.response?.data?.error || err.message}`);
    }
    setUpgrading(false);
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

      {/* Main Billing Card */}
      <section className="cyber-card">
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
            <button
              onClick={() => handleUpgradePlan('pro')}
              disabled={upgrading || userProfile?.plan === 'pro'}
              className="w-full py-2 bg-cyber-red text-white rounded font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {userProfile?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
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
