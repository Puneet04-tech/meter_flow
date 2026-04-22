import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Key, 
  BarChart2, 
  CreditCard, 
  Settings, 
  LogOut,
  ArrowUpRight,
  Clock,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { time: '00:00', req: 400 },
  { time: '04:00', req: 800 },
  { time: '08:00', req: 1200 },
  { time: '12:00', req: 3000 },
  { time: '16:00', req: 2400 },
  { time: '20:00', req: 1800 },
  { time: '23:59', req: 1200 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#050507]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0c] flex flex-col p-6">
        <div className="text-xl font-black cyber-gradient-text mb-12 tracking-tighter">MF_CONTROL</div>
        
        <nav className="flex-1 space-y-2">
          {[
            { icon: BarChart2, label: 'Analytics', active: true },
            { icon: Key, label: 'API Keys', active: false },
            { icon: Globe, label: 'Endpoints', active: false },
            { icon: CreditCard, label: 'Billing', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item, i) => (
            <a 
              key={i}
              href="#" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active 
                ? 'bg-cyber-red/10 text-cyber-red shadow-red-glow' 
                : 'text-cyber-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm tracking-widest">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5">
          <button className="flex items-center gap-3 px-4 py-3 text-cyber-muted hover:text-cyber-red transition-colors w-full">
            <LogOut size={20} />
            <span className="font-bold text-sm tracking-widest">LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-cyber-bg relative">
        <div className="glow-mesh" />
        
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Console_Main</h2>
            <p className="text-cyber-muted">Operational integrity verified. System heartbeat 12ms.</p>
          </div>
          <button className="cyber-button flex items-center gap-2">
            <Plus size={18} />
            Initialize API
          </button>
        </header>

        {/* Big Analytics Card */}
        <section className="cyber-card mb-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-cyber-red" />
              Traffic_Analysis
            </h3>
            <div className="flex gap-4">
              <span className="text-xs px-2 py-1 bg-cyber-red/20 text-cyber-red rounded border border-cyber-red/30 cursor-default">LIVE</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff003c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff003c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="time" stroke="#80808a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#80808a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121216', border: '1px solid rgba(255,0,60,0.3)', borderRadius: '8px' }}
                  itemStyle={{ color: '#ff003c' }}
                />
                <Area type="monotone" dataKey="req" stroke="#ff003c" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Small Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="cyber-card border-l-4 border-l-cyber-red">
            <div className="text-cyber-muted text-xs uppercase tracking-widest mb-2 font-black">Active Keys</div>
            <div className="text-3xl font-black flex items-center gap-2">
              12 <ArrowUpRight className="text-green-500" size={24} />
            </div>
          </div>
          <div className="cyber-card">
            <div className="text-cyber-muted text-xs uppercase tracking-widest mb-2 font-black">Errors (24h)</div>
            <div className="text-3xl font-black text-cyber-red">
              0.04<span className="text-sm text-cyber-muted font-normal">%</span>
            </div>
          </div>
          <div className="cyber-card">
            <div className="text-cyber-muted text-xs uppercase tracking-widest mb-2 font-black">Current Bill</div>
            <div className="text-3xl font-black tracking-tight">
              $142.<span className="text-cyber-red">64</span>
            </div>
          </div>
        </div>

        {/* Recent Events Table */}
        <section className="mt-12">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase">
            <Clock size={20} className="text-cyber-red" />
            Recent_Activity
          </h3>
          <div className="cyber-card p-0 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-cyber-muted text-xs font-black tracking-widest uppercase">
                <tr>
                  <th className="px-6 py-4">Endpoint</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Latency</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {[
                  { path: '/v1/users', method: 'GET', status: 200, latency: '14ms', time: 'Just now' },
                  { path: '/v1/auth', method: 'POST', status: 201, latency: '42ms', time: '2m ago' },
                  { path: '/v1/data', method: 'GET', status: 403, latency: '11ms', time: '5m ago' },
                  { path: '/v1/orders', method: 'PATCH', status: 200, latency: '28ms', time: '12m ago' },
                ].map((log, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold">{log.path}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-black">{log.method}</span></td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-2 ${log.status >= 400 ? 'text-cyber-red' : 'text-green-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${log.status >= 400 ? 'bg-cyber-red animate-pulse' : 'bg-green-500'}`} />
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-cyber-muted">{log.latency}</td>
                    <td className="px-6 py-4 text-cyber-muted">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
