import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import API from '../api';

const Billing: React.FC = () => {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBilling();
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
