import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Key, BarChart2, CreditCard, Settings, LogOut, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const Dashboard: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [keyName, setKeyName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchKeys();
    fetchApis();
  }, [navigate]);

  const fetchApis = async () => {
    try {
      const res = await API.get('/mems/list-apis');
      setApis(res.data);
    } catch (err) {
      console.error("Failed to fetch APIs", err);
    }
  };

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
    if (!selectedApiId || !keyName) {
      alert('Please select an API and enter a key name');
      return;
    }
    try {
      await API.post('/mems/keys/generate-key', { name: keyName, apiId: selectedApiId });
      fetchKeys();
      alert('API key generated successfully!');
      setShowKeyModal(false);
      setKeyName('');
      setSelectedApiId('');
    } catch (err: any) {
      console.error('Generate key error:', err);
      alert("Failed to generate key: " + (err.response?.data?.error || err.message));
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this key?")) return;
    try {
      await API.put(`/mems/keys/revoke-key/${id}`);
      fetchKeys();
      alert('Key revoked successfully');
    } catch (err) {
      console.error('Revoke key error:', err);
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
          className="text-xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-12 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
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
                ? 'bg-red-500/10 text-red-500' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-bold text-sm tracking-widest uppercase">LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-black relative">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-red-500 text-xs font-black tracking-[0.3em] uppercase">System_Active</span>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">
              API Keys<span className="text-red-500">.</span>
            </h2>
          </div>
          <button 
            onClick={() => setShowKeyModal(true)}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Generate_Key
          </button>
        </header>

        {/* Keys List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {keys.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg text-center py-12">
              <Key size={48} className="mx-auto text-gray-500 mb-4 opacity-50" />
              <p className="text-gray-400 mb-6">No active keys found in the mainframe.</p>
              <button
                onClick={() => setShowKeyModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
              >
                <Plus size={18} />
                Create_First_Key
              </button>
            </div>
          ) : (
            keys.map((k: any) => (
              <div key={k._id} className="bg-gray-900 border border-gray-800 rounded-lg flex justify-between items-center group hover:border-red-500/50 transition-colors p-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className={`p-3 rounded-lg ${k.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Key size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{k.name}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${k.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {k.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Usage: {k.usage || 0} requests</span>
                      <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, [k._id]: !prev[k._id] }))}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showKeys[k._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(k.key)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => revokeKey(k._id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Key Display */}
        {keys.map((k: any) => (
          showKeys[k._id] && (
            <motion.div
              key={`show-${k._id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-400">API Key:</span>
                <button
                  onClick={() => copyToClipboard(k.key)}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Copy
                </button>
              </div>
              <code className="text-sm text-green-400 font-mono break-all">{k.key}</code>
            </motion.div>
          )
        ))}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Key className="text-red-500" size={24} />
              <span className="text-2xl font-bold">{keys.length}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">Active Keys</h3>
            <p className="text-gray-400 text-sm">Total API keys in system</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart2 className="text-red-500" size={24} />
              <span className="text-2xl font-bold">{keys.reduce((acc, k) => acc + (k.usage || 0), 0)}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">Total Requests</h3>
            <p className="text-gray-400 text-sm">All-time API usage</p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="text-red-500" size={24} />
              <span className="text-2xl font-bold">Free</span>
            </div>
            <h3 className="font-bold text-lg mb-1">Current Plan</h3>
            <p className="text-gray-400 text-sm">Upgrade for more features</p>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-lg p-8 mt-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Upgrade to Pro Plan</h3>
          <p className="text-gray-300 mb-6">Unlock advanced features, higher rate limits, and priority support.</p>
          <button 
            onClick={() => navigate('/billing')}
            className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition-all"
          >
            Upgrade Now
          </button>
        </div>

        {/* Key Generation Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Generate New API Key</h3>
              
              {/* API Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Select API</label>
                {apis.length === 0 ? (
                  <div className="bg-gray-800 border border-gray-700 rounded p-3 text-sm text-gray-400">
                    <p className="mb-2">No APIs found.</p>
                    <button 
                      onClick={() => { setShowKeyModal(false); navigate('/create-api'); }} 
                      className="text-blue-400 hover:underline font-medium"
                    >
                      Create an API first →
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedApiId}
                      onChange={(e) => setSelectedApiId(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-red-500 focus:outline-none"
                    >
                      <option value="">-- Select an API --</option>
                      {apis.map((api: any) => (
                        <option key={api._id} value={api._id}>
                          {api.name} ({api.baseUrl})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => { setShowKeyModal(false); navigate('/create-api'); }}
                      className="mt-2 text-xs text-blue-400 hover:underline"
                    >
                      + Create new API
                    </button>
                  </>
                )}
              </div>

              {/* Key Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Key Label</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production, Testing"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateNewKey}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold"
                >
                  Generate Key
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
