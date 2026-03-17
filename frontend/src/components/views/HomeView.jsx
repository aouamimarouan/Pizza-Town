import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeView = () => {
  const navigate = useNavigate();
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
            Welcome to Pizza Town <br/>
            <span className="text-red-500 text-3xl sm:text-4xl md:text-5xl block mt-2">De Beste Pizza In Meise En Omstreken!</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-200 mb-10 max-w-2xl mx-auto text-shadow-md leading-relaxed font-medium">
            Delicious artisan pizzas and pastas, made with fresh ingredients and delivered fast to your door.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/menu')}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-red-600 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/10 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 outline-none text-lg w-full sm:w-auto"
            >
              View Menu
            </button>
            <button 
              onClick={() => navigate('/services')}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-semibold border border-stone-200 dark:border-stone-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 outline-none text-lg w-full sm:w-auto"
            >
              Book a Table
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
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Fresh Ingredients</h3>
            <p className="text-stone-600 dark:text-stone-400">Locally sourced produce and premium Italian flour for the perfect crust.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-500 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Fast Delivery</h3>
            <p className="text-stone-600 dark:text-stone-400">Hot and fresh to your door in Meise and surrounding areas.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500 shadow-sm border border-amber-100 dark:border-amber-900/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Best in Town</h3>
            <p className="text-stone-600 dark:text-stone-400">Voted the best artisan pizza by our loyal local customers.</p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default HomeView;
