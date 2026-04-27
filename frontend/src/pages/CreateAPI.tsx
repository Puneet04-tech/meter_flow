import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import API from '../api';

const CreateAPI: React.FC = () => {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/mems/create-api', { name, baseUrl, description });
      alert('API created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Create API error:', err);
      alert('Failed to create API: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-red/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-cyber-muted hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyber-red/10 border border-cyber-red/20 mb-4">
            <Plus className="text-cyber-red w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Create_API
          </h1>
          <p className="text-cyber-muted text-sm mt-2 font-bold uppercase tracking-widest">
            Register a new API endpoint for metering
          </p>
        </div>

        <div className="cyber-card backdrop-blur-xl bg-black/40">
          <form onSubmit={handleCreate} className="space-y-6">
            {/* API Name */}
            <div>
              <label className="block text-[10px] font-black text-cyber-muted uppercase tracking-[0.2em] mb-2">API_Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Payment Gateway"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyber-red focus:ring-1 focus:ring-cyber-red outline-none transition-all font-mono"
              />
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-[10px] font-black text-cyber-muted uppercase tracking-[0.2em] mb-2">Base_URL</label>
              <input
                type="url"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyber-red focus:ring-1 focus:ring-cyber-red outline-none transition-all font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black text-cyber-muted uppercase tracking-[0.2em] mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this API does..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-cyber-red focus:ring-1 focus:ring-cyber-red outline-none transition-all font-mono resize-none"
              />
            </div>

            {/* Info Alert */}
            <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
              <p className="text-sm text-yellow-500/80">
                All requests through MeterFlow gateway will be forwarded to this base URL.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-button flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {loading ? 'Creating...' : 'Create_API'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateAPI;
