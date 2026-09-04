import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

import { login, register } from '../../services/authService.js';
import SpecularButton from '../ui/SpecularButton';

// --- Zod Schemas ---
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone_number: z.string().regex(/^\d{10,}$/, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
});

// --- Password Strength Helper ---
const evaluatePasswordStrength = (password) => {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
};

const getStrengthLabel = (score) => {
  switch (score) {
    case 0: return '';
    case 1: return 'Weak';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Strong';
    default: return '';
  }
};

const LoginView = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Setup Forms
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '', phone_number: '', address: '' }
  });

  const regPassword = registerForm.watch('password');
  const strengthScore = evaluatePasswordStrength(regPassword);

  const onSubmitLogin = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      const result = await login(data);
      toast.success(t('login.successMessage', 'Successfully logged in'));
      onAuthSuccess(result.user);
    } catch (err) {
      const msg = err.response?.data?.error || t('login.errorInvalid');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRegister = async (data) => {
    setServerError('');
    setIsLoading(true);
    try {
      const result = await register(data);
      toast.success(t('login.registerSuccess', 'Account created successfully'));
      onAuthSuccess(result.user);
    } catch (err) {
      const msg = err.response?.data?.error || t('login.errorGeneric');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-paper">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-display text-ink tracking-tight">
              {isLogin ? 'Sign in to your account' : 'Create an account'}
            </h2>
            <p className="text-slate mt-2">
              {isLogin ? 'Or ' : 'Already have an account? '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setServerError(''); }}
                className="font-bold text-signal-red hover:underline focus:outline-none"
              >
                {isLogin ? 'create a new account' : 'Sign in'}
              </button>
            </p>
          </div>

          {serverError && (
            <div className="mb-6 bg-mist border border-slate text-ink px-4 py-3 rounded-md flex items-start" role="alert">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-signal-red" />
              <span className="text-sm font-medium">{serverError}</span>
            </div>
          )}

          {isLogin ? (
            /* LOGIN FORM */
            <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-ink mb-2" htmlFor="login-email">
                  {t('login.email', 'Email Address')}
                </label>
                <input
                  id="login-email"
                  type="email"
                  {...loginForm.register('email')}
                  className={`appearance-none block w-full px-4 py-3 border ${loginForm.formState.errors.email ? 'border-signal-red' : 'border-slate'} rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors`}
                  placeholder="name@example.com"
                  aria-invalid={!!loginForm.formState.errors.email}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-signal-red text-xs mt-2 font-bold">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-ink" htmlFor="login-password">
                    {t('login.password', 'Password')}
                  </label>
                  <Link to="/forgot-password" className="text-sm font-bold text-signal-red hover:underline focus:outline-none">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    {...loginForm.register('password')}
                    className={`appearance-none block w-full px-4 py-3 border ${loginForm.formState.errors.password ? 'border-signal-red' : 'border-slate'} rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors`}
                    placeholder="Enter your password"
                    aria-invalid={!!loginForm.formState.errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate hover:text-ink focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-signal-red text-xs mt-2 font-bold">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <SpecularButton type="submit" disabled={isLoading} size="lg" radius={6} tint="var(--theme-ink)" tintOpacity={1} textColor="var(--theme-paper)" lineColor="var(--theme-paper)" baseColor="var(--theme-slate)" intensity={1} className="w-full">
{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
</SpecularButton>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-ink mb-2" htmlFor="reg-name">
                    {t('login.fullName', 'Full Name')}
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    {...registerForm.register('full_name')}
                    className={`appearance-none block w-full px-4 py-3 border ${registerForm.formState.errors.full_name ? 'border-signal-red' : 'border-slate'} rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors`}
                    placeholder="Jane Doe"
                  />
                  {registerForm.formState.errors.full_name && (
                    <p className="text-signal-red text-xs mt-2 font-bold">{registerForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-ink mb-2" htmlFor="reg-phone">
                    {t('login.phone', 'Phone Number')}
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    {...registerForm.register('phone_number', {
                      onChange: (e) => e.target.value = e.target.value.replace(/[^\d+()\s-]/g, '')
                    })}
                    maxLength={15}
                    className={`appearance-none block w-full px-4 py-3 border ${registerForm.formState.errors.phone_number ? 'border-signal-red' : 'border-slate'} rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors font-mono`}
                    placeholder="0412345678"
                  />
                  {registerForm.formState.errors.phone_number && (
                    <p className="text-signal-red text-xs mt-2 font-bold">{registerForm.formState.errors.phone_number.message}</p>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-ink mb-2" htmlFor="reg-address">
                    {t('login.address', 'Address')}
                  </label>
                  <input
                    id="reg-address"
                    type="text"
                    {...registerForm.register('address')}
                    className="appearance-none block w-full px-4 py-3 border border-slate rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-ink mb-2" htmlFor="reg-email">
                    {t('login.email', 'Email Address')}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    {...registerForm.register('email')}
                    className={`appearance-none block w-full px-4 py-3 border ${registerForm.formState.errors.email ? 'border-signal-red' : 'border-slate'} rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors`}
                    placeholder="name@example.com"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-signal-red text-xs mt-2 font-bold">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-ink mb-2" htmlFor="reg-password">
                    {t('login.password', 'Password')}
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      {...registerForm.register('password')}
                      className={`appearance-none block w-full px-4 py-3 border ${registerForm.formState.errors.password ? 'border-signal-red' : 'border-slate'} rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors`}
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate hover:text-ink focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Meter (Minimal) */}
                  {regPassword && regPassword.length > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate font-medium">Strength: <span className="font-bold text-ink">{getStrengthLabel(strengthScore)}</span></span>
                      </div>
                      <div className="flex gap-1 h-1 w-full">
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i} 
                            className={`flex-1 transition-colors duration-150 ${i <= strengthScore ? 'bg-signal-red' : 'bg-mist'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {registerForm.formState.errors.password && (
                    <p className="text-signal-red text-xs mt-2 font-bold">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <SpecularButton type="submit" disabled={isLoading} size="lg" radius={6} tint="var(--theme-ink)" tintOpacity={1} textColor="var(--theme-paper)" lineColor="var(--theme-paper)" baseColor="var(--theme-slate)" intensity={1} className="w-full">
{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
</SpecularButton>
            </form>
          )}

        </div>
      </div>
      
      {/* Right side - decorative block for layout balance */}
      <div className="hidden lg:block relative w-0 flex-1 bg-mist">
        <div className="absolute inset-0 flex items-center justify-center border-l border-mist">
           <img src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Wood-fired pizza" />
           <div className="absolute inset-0 bg-ink/10 mix-blend-multiply"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
