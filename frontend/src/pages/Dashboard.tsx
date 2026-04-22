import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Key, BarChart2, CreditCard, Settings, LogOut, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const Dashboard: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchKeys();
  }, [navigate]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await API.get('/mems/keys');
      setKeys(res.data);
    } catch (err) {
      console.error("Failed to fetch keys", err);
    }
    setLoading(false);
  };

  const generateNewKey = async () => {
    const name = prompt("Enter a label for this key:");
    if (!name) return;
    try {
      await API.post('/mems/keys/generate', { name });
      fetchKeys();
    } catch (err: any) {
      alert("Failed to generate key: " + err.response?.data?.error);
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this key?")) return;
    try {
      await API.put(`/mems/keys/revoke/${id}`);
      fetchKeys();
    } catch (err) {
      alert("Failed to revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const navItems = [
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: Key, label: 'API Keys', path: '/dashboard' },
    { icon: CreditCard, label: 'Billing', path: '/billing' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#050507] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0c] flex flex-col p-6 z-20">
        <div 
          onClick={() => navigate('/')} 
          className="text-xl font-black cyber-gradient-text mb-12 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
        >
          MF_CONTROL
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item, i) => (
            <button 
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left ${
                window.location.pathname === item.path
                ? 'bg-cyber-red/10 text-cyber-red shadow-red-glow' 
                : 'text-cyber-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 text-cyber-muted hover:text-cyber-red transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm tracking-widest uppercase">LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-cyber-bg relative">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 bg-cyber-red rounded-full animate-ping" />
              <span className="text-cyber-red text-xs font-black tracking-[0.3em] uppercase">System_Active</span>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">
              API Keys<span className="text-cyber-red">.</span>exe
            </h2>
          </div>
          <button 
            onClick={generateNewKey}
            className="cyber-button flex items-center gap-2 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Generate_Key
          </button>
        </header>

        {/* Keys List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {keys.length === 0 ? (
            <div className="cyber-card text-center py-12">
              <Key size={48} className="mx-auto text-cyber-muted mb-4 opacity-50" />
              <p className="text-cyber-muted mb-6">No active keys found in the mainframe.</p>
              <button
                onClick={generateNewKey}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-red text-white rounded-lg hover:bg-cyber-red/80 transition-colors font-bold"
              >
                <Plus size={18} />
                Create_First_Key
              </button>
            </div>
          ) : (
            keys.map((k: any) => (
              <div key={k._id} className="cyber-card flex justify-between items-center group hover:border-cyber-red/50 transition-colors">
                <div className="flex items-center gap-6 flex-1">
                  <div className={`p-3 rounded-lg ${k.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Key size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-lg uppercase italic">{k.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${k.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {k.status === 'active' ? 'OPERATIONAL' : 'REVOKED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-cyber-muted text-sm">
                      <span onClick={() => setShowKeys({ ...showKeys, [k._id]: !showKeys[k._id] })} className="cursor-pointer hover:text-white transition-colors">
                        {showKeys[k._id] ? k.key : k.key.substring(0, 12) + '••••••••••••'}
                      </span>
                      <button onClick={() => setShowKeys({ ...showKeys, [k._id]: !showKeys[k._id] })} className="hover:text-cyber-red">
                        {showKeys[k._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="text-[10px] text-cyber-muted mt-2">API: {k.api?.name} | Usage: {k.usage} requests</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyToClipboard(k.key)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cyber-muted hover:text-white"
                    title="Copy key"
                  >
                    <Copy size={18} />
                  </button>
                  {k.status === 'active' && (
                    <button 
                      onClick={() => revokeKey(k._id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-cyber-muted hover:text-red-500"
                      title="Revoke key"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mt-12">
          <button
            onClick={() => navigate('/create-api')}
            className="cyber-card text-center py-8 hover:border-cyber-red/50 transition-colors group"
          >
            <Plus className="mx-auto text-cyber-red mb-3 group-hover:scale-110 transition-transform" size={32} />
            <div className="font-black text-lg mb-1">Register_API</div>
            <div className="text-cyber-muted text-xs">Add new API endpoint</div>
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="cyber-card text-center py-8 hover:border-cyber-red/50 transition-colors group"
          >
            <BarChart2 className="mx-auto text-cyber-red mb-3 group-hover:scale-110 transition-transform" size={32} />
            <div className="font-black text-lg mb-1">View_Analytics</div>
            <div className="text-cyber-muted text-xs">Usage & performance metrics</div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

  return (
    <div className="flex h-screen bg-[#050507] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0c] flex flex-col p-6 z-20">
        <div 
          onClick={() => navigate('/')} 
          className="text-xl font-black cyber-gradient-text mb-12 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
        >
          MF_CONTROL
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item, i) => (
            <button 
              key={i}
              onClick={() => setActiveTab(item.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left ${
                activeTab === item.label 
                ? 'bg-cyber-red/10 text-cyber-red shadow-red-glow' 
                : 'text-cyber-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 text-cyber-muted hover:text-cyber-red transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm tracking-widest uppercase">LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-cyber-bg relative">
        <div className="fixed inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 left-1/4 w-px h-full bg-cyber-red/20 blur-sm" />
            <div className="absolute top-0 right-1/4 w-px h-full bg-cyber-red/20 blur-sm" />
        </div>
        
        <header className="flex justify-between items-end mb-12 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="w-2 h-2 bg-cyber-red rounded-full animate-ping" />
                <span className="text-cyber-red text-xs font-black tracking-[0.3em] uppercase">System_Active</span>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">
                {activeTab}<span className="text-cyber-red">.</span>exe
            </h2>
          </div>
          {activeTab === 'API Keys' && (
            <button 
              onClick={generateNewKey}
              className="cyber-button flex items-center gap-2 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              Generate_Key
            </button>
          )}
        </header>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'Analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Big Analytics Card */}
                <section className="cyber-card">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Activity className="text-cyber-red" />
                      Global_Traffic_Feed
                    </h3>
                    <div className="flex gap-4">
                      <span className="text-[10px] px-2 py-1 bg-cyber-red/20 text-cyber-red rounded border border-cyber-red/30 font-black">REALTIME_STREAM</span>
                    </div>
                  </div>
                  
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.length > 0 ? stats : [{_id: 'no data', count: 0}]}>
                        <defs>
                          <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff003c" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ff003c" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="_id" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #ff003c', borderRadius: '4px' }}
                          itemStyle={{ color: '#ff003c' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#ff003c" strokeWidth={4} fillOpacity={1} fill="url(#colorReq)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <div className="grid grid-cols-3 gap-6">
                  <div className="cyber-card border-l-4 border-l-cyber-red">
                    <div className="text-cyber-muted text-[10px] uppercase tracking-widest mb-1 font-black">Authorized_Nodes</div>
                    <div className="text-4xl font-black italic">{keys.filter(k => k.isActive).length}</div>
                  </div>
                  <div className="cyber-card">
                    <div className="text-cyber-muted text-[10px] uppercase tracking-widest mb-1 font-black">Total_Requests</div>
                    <div className="text-4xl font-black italic text-cyber-red">{billing?.totalRequests || 0}</div>
                  </div>
                  <div className="cyber-card border-r-4 border-r-cyber-red">
                    <div className="text-cyber-muted text-[10px] uppercase tracking-widest mb-1 font-black">Current_Liability</div>
                    <div className="text-4xl font-black italic">${billing?.amount || '0.00'}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'API Keys' && (
              <motion.div
                key="keys"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid gap-4">
                  {keys.map((k) => (
                    <div key={k._id} className="cyber-card flex justify-between items-center group hover:border-cyber-red/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`p-3 rounded-lg ${k.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <Key size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-black text-lg uppercase italic">{k.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${k.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {k.isActive ? 'OPERATIONAL' : 'REVOKED'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-cyber-muted text-sm">
                            {k.key.substring(0, 12)}••••••••••••
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(k.key);
                                    alert("Key copied to clipboard");
                                }}
                                className="hover:text-white transition-colors"
                            >
                                <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-8">
                            <div className="text-[10px] text-cyber-muted uppercase font-black">Created</div>
                            <div className="text-sm font-bold">{new Date(k.createdAt).toLocaleDateString()}</div>
                        </div>
                        {k.isActive && (
                            <button 
                                onClick={() => revokeKey(k._id)}
                                className="p-3 text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 rounded-lg transition-all"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {keys.length === 0 && (
                    <div className="cyber-card text-center py-20 border-dashed opacity-50">
                        <AlertCircle size={48} className="mx-auto mb-4 text-cyber-muted" />
                        <p className="font-bold text-cyber-muted uppercase tracking-widest">No active keys found in the mainframe.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Billing' && (
                <motion.div
                    key="billing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 gap-8"
                >
                    <div className="cyber-card">
                        <h3 className="text-2xl font-black mb-8 italic uppercase border-b border-white/5 pb-4">Usage_Report</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-cyber-muted font-bold">Free Tier Usage</span>
                                <span className="font-mono">{billing?.totalRequests || 0} / 1000</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-cyber-red shadow-red-glow transition-all duration-1000"
                                    style={{ width: `${Math.min(((billing?.totalRequests || 0)/1000)*100, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <span className="text-xl font-black italic">Total Balance</span>
                                <span className="text-3xl font-black text-cyber-red">${billing?.amount || '0.00'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="cyber-card bg-cyber-red/5 border-cyber-red/20">
                        <CreditCard size={40} className="mb-6 text-cyber-red" />
                        <h3 className="text-xl font-black mb-2 uppercase">Subscription_Active</h3>
                        <p className="text-sm text-cyber-muted mb-8 italic">Your account is currently on the Developer tier. Upgrade for higher rate limits and priority support.</p>
                        <button className="w-full py-4 bg-cyber-red text-white font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-red-glow">
                            Upgrade_Tier
                        </button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
