import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Flame, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HomeView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-stone-900 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 bg-stone-900">
          <img 
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2670&auto=format&fit=crop" 
            alt="Delicious fresh pizza" 
            className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-900/40 dark:from-stone-950 dark:via-stone-950/60 to-transparent transition-colors"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mt-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 text-shadow-lg leading-tight">
            {t('home.heroTitle1')} <br/>
            <span className="text-red-500 text-3xl sm:text-4xl md:text-5xl block mt-2">{t('home.heroTitle2')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-200 mb-10 max-w-2xl mx-auto text-shadow-md leading-relaxed font-medium">
            {t('home.heroDesc')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/menu')}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-red-600 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/10 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 outline-none text-lg w-full sm:w-auto"
            >
              {t('home.viewMenu')}
            </button>
            <button 
              onClick={() => navigate('/book')}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-semibold border border-stone-200 dark:border-stone-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 outline-none text-lg w-full sm:w-auto"
            >
              {t('home.bookTable')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Bar (Overlapping) */}
      <section className="relative z-20 -mt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4 text-red-600 dark:text-red-500 shadow-sm border border-red-100 dark:border-red-900/30">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('home.feature1Title')}</h3>
            <p className="text-stone-600 dark:text-stone-400">{t('home.feature1Desc')}</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
              <Flame className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('home.feature2Title')}</h3>
            <p className="text-stone-600 dark:text-stone-400">{t('home.feature2Desc')}</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500 shadow-sm border border-amber-100 dark:border-amber-900/30">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{t('home.feature3Title')}</h3>
            <p className="text-stone-600 dark:text-stone-400">{t('home.feature3Desc')}</p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default HomeView;
