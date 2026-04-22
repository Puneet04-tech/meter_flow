import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Activity } from 'lucide-react';
import API from '../api';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clear old tokens first
            localStorage.removeItem('token');
            
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            console.log(`Attempting ${isRegister ? 'register' : 'login'} at ${endpoint}`);
            const { data } = await API.post(endpoint, { email, password });
            console.log('Auth success, token received');
            localStorage.setItem('token', data.token);
            
            // Force a small delay to ensure token is stored
            await new Promise(r => setTimeout(r, 100));
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login/Register failed:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Authentication failed';
            alert(`Error: ${msg}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-red/5 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyber-red/10 border border-cyber-red/20 mb-4">
                        <Shield className="text-cyber-red w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                        {isRegister ? 'Initialize_Access' : 'Authorize_Session'}
                    </h1>
                    <p className="text-cyber-muted text-sm mt-2 font-bold uppercase tracking-widest">
                        {isRegister ? 'Create your mainframe credentials' : 'Enter security credentials to proceed'}
                    </p>
                </div>

                <div className="cyber-card backdrop-blur-xl bg-black/40">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-cyber-muted uppercase tracking-[0.2em] mb-2">Email_Address</label>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-cyber-red focus:ring-1 focus:ring-cyber-red outline-none transition-all font-mono"
                                    placeholder="user@meterflow.io"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-cyber-muted uppercase tracking-[0.2em] mb-2">Access_Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
                                <input 
                                    type="password" 
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white focus:border-cyber-red focus:ring-1 focus:ring-cyber-red outline-none transition-all font-mono"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            type="submit" 
                            className="w-full py-4 bg-cyber-red text-white font-black uppercase tracking-[0.3em] hover:bg-red-700 transition-all shadow-red-glow flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    Execute {isRegister ? 'Signup' : 'Login'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <button 
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs text-cyber-muted hover:text-cyber-red font-bold uppercase tracking-widest transition-colors underline decoration-cyber-red/20 underline-offset-4"
                        >
                            {isRegister ? 'Already have access? Authorize' : 'No credentials? Initialize access'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="text-[10px] font-black text-cyber-muted">SSL_SECURED</div>
                    <div className="text-[10px] font-black text-cyber-muted">ENCRYPTED_256BIT</div>
                    <div className="text-[10px] font-black text-cyber-muted">LOCAL_V9_AUTH</div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
