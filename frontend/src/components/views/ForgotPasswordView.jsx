import React, { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/authService.js';
import SpecularButton from '../ui/SpecularButton';
import { useTranslation } from 'react-i18next';

const ForgotPasswordView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(t('forgotPassword.errorGeneric', 'Une erreur est survenue lors de la demande. Veuillez réessayer.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-paper">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate hover:text-ink mb-8 transition-colors focus:outline-none focus:ring-1 focus:ring-signal-red">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('forgotPassword.backToLogin', 'Retour à la connexion')}
          </Link>

          {isSuccess ? (
            <div className="text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-mist text-ink rounded-md flex items-center justify-center mx-auto mb-6 border border-slate">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-ink mb-2 tracking-tight">{t('forgotPassword.emailSentTitle', 'Email envoyé !')}</h2>
              <p className="text-slate mb-8 font-sans">
                {t('forgotPassword.emailSentDesc', 'Si le compte existe, un email a été envoyé à {{email}} avec les instructions pour réinitialiser le mot de passe.', { email: email })}
              </p>
              <SpecularButton onClick={() => navigate('/login')} size="lg" radius={6} tint="var(--theme-ink)" tintOpacity={1} textColor="var(--theme-paper)" lineColor="var(--theme-paper)" baseColor="var(--theme-slate)" intensity={1} className="w-full">
{t('forgotPassword.backToHome', "Retourner à l'accueil")}
</SpecularButton>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold font-display text-ink tracking-tight">{t('forgotPassword.title', 'Mot de passe oublié ?')}</h2>
                <p className="text-slate mt-2 font-sans">
                  {t('forgotPassword.desc', "Saisis ton adresse email et nous t'enverrons un lien pour réinitialiser ton mot de passe.")}
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-mist border border-slate text-ink px-4 py-3 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-signal-red" />
                  <span className="text-sm font-bold font-sans">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-ink mb-2">
                    {t('forgotPassword.emailLabel', 'Adresse Email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate rounded-md shadow-sm bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-signal-red focus:border-signal-red transition-colors"
                    placeholder={t('forgotPassword.emailPlaceholder', 'ton@email.com')}
                  />
                </div>

                <SpecularButton type="submit" disabled={isLoading} size="lg" radius={6} tint="var(--theme-ink)" tintOpacity={1} textColor="var(--theme-paper)" lineColor="var(--theme-paper)" baseColor="var(--theme-slate)" intensity={1} className="w-full">
{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('forgotPassword.submitBtn', 'Envoyer le lien')}
</SpecularButton>
              </form>
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

export default ForgotPasswordView;
