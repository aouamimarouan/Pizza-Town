import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function AccountSettingsView() {
  const { t } = useTranslation();
  
  // Data state
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const profileRes = await api.get('/users/profile');
      setProfile(profileRes.data);
      setSettingsForm(prev => ({
        ...prev,
        full_name: profileRes.data.full_name || '',
        phone_number: profileRes.data.phone_number || '',
        address: profileRes.data.address || ''
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsStatus('');
    try {
      const res = await api.put('/users/profile', {
        full_name: settingsForm.full_name,
        phone_number: settingsForm.phone_number,
        address: settingsForm.address
      });
      
      setProfile(prev => ({ ...prev, ...res.data }));
      
      const stored = localStorage.getItem('pt_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('pt_user', JSON.stringify({ ...parsed, ...res.data }));
        window.dispatchEvent(new Event('auth:update'));
      }

      setSettingsStatus('Saved');
      setTimeout(() => setSettingsStatus(''), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordStatus('');
    setPasswordError('');
    
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await api.put('/auth/update-password', {
        currentPassword: settingsForm.currentPassword,
        newPassword: settingsForm.newPassword
      });
      setPasswordStatus('Saved');
      setSettingsForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setPasswordStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.error || 'Failed to update password');
    }
  };

  if (isLoading || !profile) {
    return <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-slate">Loading...</div>;
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const initials = profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'US';

  const isSettingsChanged = settingsForm.full_name !== (profile.full_name || '') || 
                            settingsForm.phone_number !== (profile.phone_number || '') || 
                            settingsForm.address !== (profile.address || '');

  const isPasswordChanged = settingsForm.currentPassword.length > 0 && 
                            settingsForm.newPassword.length > 0 && 
                            settingsForm.confirmPassword.length > 0;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        {/* Account Overview Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 mb-12">
          <div className="w-16 h-16 rounded-md bg-ink text-paper flex items-center justify-center font-display font-bold text-2xl shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-ink tracking-tight">{profile.full_name || 'Customer'}</h1>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-1 font-sans text-sm text-slate">
              <span>Member since {joinDate}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pb-24 space-y-12">
          
          <form onSubmit={handleSettingsSave} className="space-y-6 max-w-lg bg-mist p-4 sm:p-6 md:p-8 rounded-md">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-ink" />
                <h3 className="font-display font-bold text-xl text-ink">Personal Info & Contact</h3>
              </div>
              {settingsStatus === 'Saved' && <span className="text-sm font-sans text-slate animate-in fade-in">Saved</span>}
            </div>

            <div className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-slate mb-1">Full Name</label>
                <input 
                  type="text"
                  value={settingsForm.full_name}
                  onChange={e => setSettingsForm({...settingsForm, full_name: e.target.value})}
                  className="w-full bg-paper border border-slate rounded-md px-3 py-2 text-ink focus:outline-none focus:border-ink transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate mb-1">Email (Read Only)</label>
                <input 
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-mist border border-slate rounded-md px-3 py-2 text-slate cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate mb-1">Phone Number</label>
                <input 
                  type="tel"
                  value={settingsForm.phone_number}
                  onChange={e => setSettingsForm({...settingsForm, phone_number: e.target.value.replace(/[^\d+()\s-]/g, '')})}
                  className="w-full bg-paper border border-slate rounded-md px-3 py-2 text-ink focus:outline-none focus:border-ink transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate mb-1">Default Delivery Address</label>
                <textarea 
                  rows={2}
                  value={settingsForm.address}
                  onChange={e => setSettingsForm({...settingsForm, address: e.target.value})}
                  className="w-full bg-paper border border-slate rounded-md px-3 py-2 text-ink focus:outline-none focus:border-ink transition-colors resize-none"
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={!isSettingsChanged}
                  className={`px-6 py-2 font-sans font-medium rounded-md transition-colors ${
                    isSettingsChanged 
                      ? 'bg-signal-red text-white hover:bg-red-700' 
                      : 'bg-paper text-slate cursor-not-allowed border border-slate/20'
                  }`}
                >
                  Save changes
                </button>
              </div>
            </div>
          </form>

          <form onSubmit={handlePasswordSave} className="space-y-6 max-w-lg bg-mist p-4 sm:p-6 md:p-8 rounded-md">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-ink" />
                <h3 className="font-display font-bold text-xl text-ink">Security</h3>
              </div>
              {passwordStatus === 'Saved' && <span className="text-sm font-sans text-slate animate-in fade-in">Saved</span>}
            </div>

            <div className="space-y-4 font-sans text-sm">
              <input type="text" name="username" autoComplete="username" value={profile.email} className="hidden" readOnly />

              <div>
                <label className="block text-slate mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPw ? "text" : "password"}
                    name="current-password"
                    autoComplete="current-password"
                    required
                    value={settingsForm.currentPassword}
                    onChange={e => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                    className="w-full bg-paper border border-slate rounded-md px-3 py-2 pr-10 text-ink focus:outline-none focus:border-ink transition-colors"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink">
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate mb-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPw ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={settingsForm.newPassword}
                      onChange={e => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                      className="w-full bg-paper border border-slate rounded-md px-3 py-2 pr-10 text-ink focus:outline-none focus:border-ink transition-colors"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate mb-1">Confirm New Password</label>
                  <input 
                    type="password"
                    name="confirm-new-password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={settingsForm.confirmPassword}
                    onChange={e => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                    className="w-full bg-paper border border-slate rounded-md px-3 py-2 text-ink focus:outline-none focus:border-ink transition-colors"
                  />
                </div>
              </div>
              
              {passwordError && <p className="text-signal-red font-medium text-sm">{passwordError}</p>}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={!isPasswordChanged}
                  className={`px-6 py-2 font-sans font-medium rounded-md transition-colors ${
                    isPasswordChanged 
                      ? 'bg-signal-red text-white hover:bg-red-700' 
                      : 'bg-paper text-slate cursor-not-allowed border border-slate/20'
                  }`}
                >
                  Update password
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
