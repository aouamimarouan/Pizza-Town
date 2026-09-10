import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService.js';
import SpecularButton from '../ui/SpecularButton';
import { useTranslation } from 'react-i18next';

const ResetPasswordView = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.errorInvalidLink', 'Lien de réinitialisation invalide ou manquant.'));
    }
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('login.errorPasswordMismatch', 'Les mots de passe ne correspondent pas.'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('resetPassword.errorLength', 'Le mot de passe doit contenir au moins 6 caractères.'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('resetPassword.errorGeneric', 'Une erreur est survenue. Le lien a peut-être expiré.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-paper">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          {isSuccess ? (
            <div className="text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-mist text-ink rounded-md flex items-center justify-center mx-auto mb-6 border border-slate">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-ink mb-2 tracking-tight">{t('resetPassword.successTitle', 'Mot de passe modifié !')}</h2>
              <p className="text-slate font-sans mb-8">
                {t('resetPassword.successDesc', 'Ton mot de passe a été réinitialisé avec succès. Tu vas être redirigé vers la page de connexion...')}
              </p>
              <SpecularButton onClick={() => navigate('/login')} size="lg" radius={6} tint="var(--theme-ink)" tintOpacity={1} textColor="var(--theme-paper)" lineColor="var(--theme-paper)" baseColor="var(--theme-slate)" intensity={1} className="w-full">
{t('login.signInTab', 'Se connecter')} <ArrowRight className="ml-2 w-5 h-5" />
</SpecularButton>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold font-display text-ink tracking-tight">{t('resetPassword.title', 'Nouveau mot de passe')}</h2>
                <p className="text-slate mt-2 font-sans">
                  {t('resetPassword.desc', 'Choisis un nouveau mot de passe sécurisé pour ton compte.')}
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-mist border border-slate text-ink px-4 py-3 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-signal-red" />
                  <span className="text-sm font-bold font-sans">{error}</span>
                </div>
              )}

              {!token && (
                <div className="mt-6">
                   <SpecularButton onClick={() => navigate('/forgot-password')} size="lg" radius={6} tint="var(--theme-signal-red)" tintOpacity={1} textColor="#ffffff" lineColor="#ffffff" baseColor="#800000" intensity={1.2} className="w-full">
Demander un nouveau lien
</SpecularButton>
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">
                      {t('resetPassword.passwordLabel', 'Nouveau mot de passe')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-slate rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors"
                        placeholder={t('resetPassword.passwordPlaceholder', 'Min. 6 caractères')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate hover:text-ink focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ink mb-2">
                      {t('resetPassword.confirmLabel', 'Confirmer le mot de passe')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-slate rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors"
                        placeholder={t('resetPassword.confirmPlaceholder', 'Confirmer le mot de passe')}
                      />
                    </div>
                  </div>

                  <SpecularButton type="submit" disabled={isLoading} size="lg" radius={6} tint="var(--theme-ink)" tintOpacity={1} textColor="var(--theme-paper)" lineColor="var(--theme-paper)" baseColor="var(--theme-slate)" intensity={1} className="w-full">
{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('resetPassword.submitBtn', 'Réinitialiser le mot de passe')}
</SpecularButton>
                </form>
              )}
            </div>
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

export default ResetPasswordView;
