import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import API from '../api';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [keyStats, setKeyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, keyStatsRes] = await Promise.all([
        API.get('/billing/stats'),
        API.get('/billing/key-stats')
      ]);
      setStats(statsRes.data);
      setKeyStats(keyStatsRes.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
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
          Analytics<span className="text-cyber-red">.</span>exe
        </h2>
      </div>

      {/* Usage Trends */}
      <section className="cyber-card">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
          <TrendingUp className="text-cyber-red" size={20} />
          Usage_Timeline
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.length > 0 ? stats : []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="_id" stroke="#888" fontSize={10} />
              <YAxis stroke="#888" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #fbbf24' }} />
              <Area type="monotone" dataKey="count" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-Key Stats */}
      <section className="cyber-card">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Activity className="text-cyber-red" size={20} />
          Per_Key_Performance
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keyStats.length > 0 ? keyStats : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="keyName" stroke="#888" fontSize={10} />
              <YAxis stroke="#888" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #2563eb' }} />
              <Legend />
              <Bar dataKey="totalRequests" fill="#2563eb" name="Total_Requests" />
              <Bar dataKey="avgLatency" fill="#fbbf24" name="Avg_Latency_ms" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Detailed Stats Table */}
      <section className="cyber-card">
        <h3 className="text-lg font-bold mb-4">Detailed_Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-4 text-cyber-muted font-black text-xs uppercase">Key_Name</th>
                <th className="text-left py-2 px-4 text-cyber-muted font-black text-xs uppercase">API</th>
                <th className="text-right py-2 px-4 text-cyber-muted font-black text-xs uppercase">Requests</th>
                <th className="text-right py-2 px-4 text-cyber-muted font-black text-xs uppercase">Avg_Latency</th>
                <th className="text-right py-2 px-4 text-cyber-muted font-black text-xs uppercase">Success_Rate</th>
              </tr>
            </thead>
            <tbody>
              {keyStats.map((stat: any, i: number) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono text-sm">{stat.keyName}</td>
                  <td className="py-3 px-4 font-mono text-sm">{stat.apiName}</td>
                  <td className="py-3 px-4 text-right font-bold">{stat.totalRequests}</td>
                  <td className="py-3 px-4 text-right text-cyber-red">{stat.avgLatency}ms</td>
                  <td className="py-3 px-4 text-right text-green-400">{stat.successRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};

export default Analytics;
