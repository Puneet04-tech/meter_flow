import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Shield, Bell, Save } from 'lucide-react';
import API from '../api';

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/billing/profile');
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await API.put('/billing/profile', {
        plan: profile.plan,
        role: profile.role
      });
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-2xl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-2 bg-cyber-red rounded-full animate-ping" />
          <span className="text-cyber-red text-xs font-black tracking-[0.3em] uppercase">System_Active</span>
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter italic">
          Settings<span className="text-cyber-red">.</span>exe
        </h2>
      </div>

      {/* Profile Section */}
      <section className="cyber-card">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-cyber-red" size={24} />
          <h3 className="text-2xl font-bold">Account_Profile</h3>
        </div>

        {profile && (
          <div className="space-y-6">
            {/* User Info */}
            <div>
              <label className="block text-xs uppercase font-black text-cyber-muted mb-2 tracking-widest">Email_Address</label>
              <div className="cyber-input bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white font-mono">
                {profile.email}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs uppercase font-black text-cyber-muted mb-2 tracking-widest">Account_Role</label>
              <select 
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white outline-none focus:border-cyber-red transition-colors font-mono"
              >
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="consumer">Consumer</option>
              </select>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-xs uppercase font-black text-cyber-muted mb-2 tracking-widest">Subscription_Plan</label>
              <div className="grid grid-cols-3 gap-4">
                {['free', 'pro', 'enterprise'].map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setProfile({ ...profile, plan })}
                    className={`py-3 px-4 rounded-lg border-2 transition-all font-black uppercase text-sm ${
                      profile.plan === plan
                        ? 'border-cyber-red bg-cyber-red/10 text-cyber-red'
                        : 'border-white/20 text-cyber-muted hover:border-white/40'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div>
                <div className="text-cyber-muted text-xs uppercase font-black mb-1">Total_Requests</div>
                <div className="text-3xl font-black text-cyber-red">{profile.stats?.totalRequests || 0}</div>
              </div>
              <div>
                <div className="text-cyber-muted text-xs uppercase font-black mb-1">Active_APIs</div>
                <div className="text-3xl font-black">{profile.stats?.apiCount || 0}</div>
              </div>
              <div>
                <div className="text-cyber-muted text-xs uppercase font-black mb-1">API_Keys</div>
                <div className="text-3xl font-black">{profile.stats?.keyCount || 0}</div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full cyber-button flex items-center justify-center gap-2 mt-6"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save_Changes'}
            </button>
          </div>
        )}
      </section>

      {/* Security Section */}
      <section className="cyber-card">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-yellow-500" size={24} />
          <h3 className="text-2xl font-bold">Security_Settings</h3>
        </div>

        <div className="space-y-4">
          <button className="w-full text-left py-3 px-4 border border-white/10 rounded-lg hover:border-cyber-red/50 transition-colors group">
            <div className="flex justify-between items-center">
              <span className="font-bold">Change_Password</span>
              <span className="text-cyber-muted group-hover:text-cyber-red transition-colors">→</span>
            </div>
            <div className="text-sm text-cyber-muted text-xs mt-1">Last changed 30 days ago</div>
          </button>

          <button className="w-full text-left py-3 px-4 border border-white/10 rounded-lg hover:border-cyber-red/50 transition-colors group">
            <div className="flex justify-between items-center">
              <span className="font-bold">Two_Factor_Authentication</span>
              <span className="text-cyber-red font-black text-xs">DISABLED</span>
            </div>
            <div className="text-sm text-cyber-muted text-xs mt-1">Secure your account with 2FA</div>
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="cyber-card">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-cyan-400" size={24} />
          <h3 className="text-2xl font-bold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="font-bold">Email_on_usage_alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="font-bold">Weekly_usage_summary</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input type="checkbox" className="w-5 h-5" />
            <span className="font-bold">Billing_alerts</span>
          </label>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="cyber-card border border-red-500/30">
        <h3 className="text-lg font-bold text-red-500 mb-4">Danger_Zone</h3>
        <button className="w-full py-3 px-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-black uppercase text-sm">
          Delete_Account
        </button>
      </section>
    </motion.div>
  );
};

export default SettingsPage;
