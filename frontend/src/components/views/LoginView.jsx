import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Phone, MapPin, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { login, register } from '../../services/authService.js';

const LoginView = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login({ email, password });
      } else {
        result = await register({
          full_name: regName,
          email,
          password,
          phone_number: regPhone,
          address: regAddress,
        });
      }
      onAuthSuccess(result.user);
    } catch (err) {
      const status = err.response?.status;
      let msg = t('login.errorGeneric');
      
      if (status === 401 || status === 404) {
        msg = t('login.errorInvalid');
      } else if (err.response?.data?.error) {
        msg = err.response.data.error; // Keep backend string for specific validation errors
      }
      
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-stone-50 dark:bg-[#151515] transition-colors">
      <div className="max-w-xl w-full bg-white dark:bg-[#0a0a0a] rounded-3xl p-8 shadow-2xl border border-stone-100 dark:border-stone-800 transition-all duration-300">
        
        {/* Custom VIP Toggle */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 flex justify-center items-center py-4 px-2 text-sm font-bold rounded-2xl transition-all duration-300 ${
              isLogin 
                ? 'bg-stone-100 dark:bg-[#151515] text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-inner' 
                : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-[#111] border border-transparent'
            }`}
          >
            {t('login.signInTab')}
          </button>
          
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 flex justify-center items-center py-4 px-2 text-sm font-bold rounded-2xl transition-all duration-300 relative overflow-hidden group border ${
              !isLogin 
                ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                : 'border-transparent text-stone-500 hover:bg-stone-50 dark:hover:bg-[#111]'
            }`}
          >
            {/* VIP Gradient Background for Active State */}
            {!isLogin && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-90 transition-opacity"></div>
            )}
            
            <span className={`relative z-10 flex items-center ${!isLogin ? 'text-white' : ''}`}>
              {t('login.vipTab')}
              {!isLogin && <ArrowRight className="w-4 h-4 ml-2 animate-pulse" />}
            </span>
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-heading">
            {isLogin ? t('login.welcomeTitle') : t('login.vipTitle')}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 mt-2">
            {isLogin ? t('login.welcomeDesc') : t('login.vipDesc')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-start animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Registration Extra Fields */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t('login.fullName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none font-medium"
                    placeholder={t('login.fullNamePlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('login.phone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    </div>
                    <input
                      type="tel"
                      required={!isLogin}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none font-medium"
                      placeholder={t('login.phonePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('login.address')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none font-medium"
                      placeholder={t('login.addressPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Standard Fields (Always Visible) */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              {t('login.email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-stone-400 dark:text-stone-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:ring-2 transition-colors outline-none font-medium ${isLogin ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                placeholder={t('login.emailPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              {t('login.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-stone-400 dark:text-stone-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:ring-2 transition-colors outline-none font-medium ${isLogin ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'}`}
                placeholder={t('login.passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl mt-8 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 ${
              isLogin
                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20 focus:ring-red-500'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 focus:ring-emerald-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0a]`}
          >
            {isLoading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {isLogin ? t('login.btnSigningIn') : t('login.btnCreating')}</>
              : isLogin ? t('login.btnSecureSignIn') : t('login.btnCompleteVIP')
            }
          </button>

          {isLogin && (
            <div className="mt-6 text-center">
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                {t('login.noAccount')}{' '}
                <button 
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="font-bold text-stone-900 dark:text-white hover:text-red-600 dark:hover:text-red-500 transition-colors"
                >
                  {t('login.createOne')}
                </button>
              </p>
            </div>
          )}
          {!isLogin && (
            <div className="mt-6 text-center">
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                {t('login.hasAccount')}{' '}
                <button 
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="font-bold text-stone-900 dark:text-white hover:text-emerald-500 transition-colors"
                >
                  {t('login.signInTab')}
                </button>
              </p>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};

export default LoginView;
