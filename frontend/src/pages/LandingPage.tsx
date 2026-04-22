import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Shield, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="glow-mesh" />
      
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-black cyber-gradient-text tracking-tighter">METERFLOW</div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-cyber-muted">
          <a href="#" className="hover:text-cyber-red transition-colors">Documentation</a>
          <a href="#" className="hover:text-cyber-red transition-colors">Pricing</a>
          <a href="#" className="hover:text-cyber-red transition-colors">Gateway</a>
        </div>
        <button className="cyber-button text-xs">
          Connect Terminal
        </button>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black leading-tight mb-6">
              MONETIZE YOUR <br />
              <span className="cyber-gradient-text">API ECOSYSTEM</span>
            </h1>
            <p className="text-xl text-cyber-muted mb-12 max-w-2xl leading-relaxed">
              Precision metering, real-time analytics, and automated billing for the modern developer. 
              The industrial-grade gateway for usage-based SaaS.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-cyber-red text-white font-bold rounded-lg shadow-red-glow hover:shadow-red-glow-lg transition-all uppercase tracking-widest"
              >
                Access Terminal
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-all uppercase tracking-widest">
                Documentation
              </button>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mt-32">
          {[
            { label: 'Uptime', value: '99.99%', icon: Activity },
            { label: 'Latency', value: '< 20ms', icon: Zap },
            { label: 'Requests/sec', value: '50k+', icon: Shield },
            { label: 'Reliability', value: 'Enterprise', icon: BarChart3 },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="cyber-card group"
            >
              <stat.icon className="w-8 h-8 text-cyber-red mb-4 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-cyber-muted uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyber-red blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default LandingPage;
