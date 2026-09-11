import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SpecularButton from '../ui/SpecularButton';
import FlowingMenu from '../ui/FlowingMenu';
import LineSidebar from '../ui/LineSidebar';

const HomeView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const demoItems = [
    { link: '/menu', text: t('menu.catPizzas', 'Nos Pizzas'), image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop' },
    { link: '/menu', text: t('home.catStarters', 'Entrées'), image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=600&auto=format&fit=crop' },
    { link: '/menu', text: t('home.catPastas', 'Pâtes'), image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=600&auto=format&fit=crop' },
    { link: '/menu', text: t('menu.catDesserts', 'Desserts'), image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=600&auto=format&fit=crop' }
  ];

  return (
    <div className="w-full bg-paper min-h-screen">
      {/* 1. Hero Section - Asymmetric Grid with Framed Image */}
      <section className="relative flex flex-col md:flex-row min-h-[70vh] max-w-7xl mx-auto border-b border-mist">
        
        {/* Left 55% - Content */}
        <div className="w-full md:w-[55%] flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-16 md:py-24 z-10 bg-paper">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-ink tracking-tight mb-6 leading-tight">
              {t('home.heroTitle1')} <br/>
              <span className="text-signal-red block mt-2">{t('home.heroTitle2')}</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate mb-12 leading-relaxed font-medium max-w-lg">
              {t('home.heroDesc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <SpecularButton 
                onClick={() => navigate('/menu')}
                size="lg"
                radius={6}
                tint="var(--theme-signal-red)"
                tintOpacity={1}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#800000"
                intensity={1.2}
                autoAnimate={false}
                followMouse={true}
                className="w-full sm:w-auto shadow-sm"
              >
                {t('home.viewMenu')}
              </SpecularButton>
              <SpecularButton 
                onClick={() => navigate('/book')}
                size="lg"
                radius={6}
                tint="var(--theme-paper)"
                tintOpacity={1}
                textColor="var(--theme-ink)"
                lineColor="var(--theme-signal-red)"
                baseColor="var(--theme-slate)"
                intensity={1}
                autoAnimate={false}
                followMouse={true}
                className="w-full sm:w-auto border border-slate shadow-sm"
              >
                {t('home.bookTable')}
              </SpecularButton>
            </div>
          </div>
        </div>

        {/* Right 45% - Organized Framed Image */}
        <div className="w-full md:w-[45%] h-[50vh] md:h-auto relative bg-mist/50 flex flex-col justify-center p-8 lg:p-12">
          <div className="hidden md:block absolute inset-y-0 left-0 w-px bg-mist z-20"></div>
          
          <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
             {/* Frame background offset */}
             <div className="absolute inset-0 bg-ink rounded-lg translate-x-3 translate-y-3 opacity-5"></div>
             {/* Main Image */}
             <img 
               src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop" 
               alt="Freshly baked pizza" 
               className="relative w-full h-full object-cover object-center rounded-lg shadow-md border border-mist z-10"
             />
             <div className="absolute -bottom-6 -left-6 bg-paper px-6 py-4 rounded-md shadow-lg border border-mist z-20 hidden sm:block">
                <p className="font-mono text-xs text-slate uppercase tracking-widest mb-1">Authentic</p>
                <p className="font-bold text-ink font-display">Italian Recipes</p>
             </div>
          </div>
        </div>
      </section>

      {/* 2. À propos de nous (The Story / Confidence Section) */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto py-24 border-b border-mist">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Details column */}
          <div className="order-2 lg:order-1">
            <span className="inline-block px-3 py-1 bg-mist border border-slate text-xs font-bold text-ink uppercase tracking-widest rounded-full mb-6">
              {t('home.aboutUsBadge', 'À propos de nous')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-ink tracking-tight mb-6">
              {t('home.storyTitle1', 'Une passion locale,')} <br/>
              <span className="text-signal-red">{t('home.storyTitle2', 'depuis 2015.')}</span>
            </h2>
            <p className="text-lg text-slate mb-12 leading-relaxed font-medium">
              {t('home.storyDesc', 'Nous croyons en une chose simple : une bonne pizza nécessite des ingrédients exceptionnels et une pâte respectée. Pas de raccourcis, pas de compromis. Juste le goût authentique de l\'Italie, servi au cœur de Meise.')}
            </p>
            
            {/* Organized Facts block */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-mist rounded-lg p-6 border border-slate">
                <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center border border-slate mb-4">
                   <span className="font-display font-bold text-signal-red text-xl">1</span>
                </div>
                <p className="text-4xl font-bold font-mono text-ink mb-2">450°C</p>
                <p className="text-sm font-bold text-slate uppercase tracking-widest">{t('home.fact2Label', 'Four traditionnel')}</p>
              </div>
              <div className="flex-1 bg-mist rounded-lg p-6 border border-slate">
                <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center border border-slate mb-4">
                   <span className="font-display font-bold text-signal-red text-xl">2</span>
                </div>
                <p className="text-4xl font-bold font-mono text-ink mb-2">{t('home.fact1Value', '< 1h')}</p>
                <p className="text-sm font-bold text-slate uppercase tracking-widest">{t('home.fact1Label', 'Livraison rapide')}</p>
              </div>
            </div>
          </div>
          
          {/* Images Collage column */}
          <div className="order-1 lg:order-2 relative h-[450px] sm:h-[600px] w-full">
            <img 
              src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1000&auto=format&fit=crop" 
              alt="Chef preparing pizza" 
              className="absolute top-0 right-0 w-[75%] h-[75%] object-cover rounded-lg shadow-md border border-mist z-0" 
            />
            <img 
              src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1000&auto=format&fit=crop" 
              alt="Freshly baked artisan pizza" 
              className="absolute bottom-0 left-0 w-[60%] h-[50%] object-cover rounded-lg shadow-xl border-[6px] border-paper z-10" 
            />
            
            {/* Decorative element to tie them together */}
            <div className="absolute top-[65%] left-[65%] w-24 h-24 rounded-full border border-dashed border-slate bg-paper/50 backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
               <span className="text-xs font-mono font-bold text-signal-red uppercase tracking-widest text-center">{t('home.localBadge1', 'Meise')}<br/>{t('home.localBadge2', 'Local')}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Découvrez notre carte (Menu Explorer Section) */}
      <section className="w-full border-b border-mist bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="inline-block px-3 py-1 bg-mist border border-slate text-xs font-bold text-ink uppercase tracking-widest rounded-full mb-4">{t('home.menuBadge', 'Notre Menu')}</span>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-ink tracking-tight">
                {t('home.exploreMenu', 'Découvrez notre carte')}
              </h2>
              <p className="text-slate font-medium mt-2">
                {t('home.exploreDesc', 'Des classiques italiens aux créations originales, tout est fait maison.')}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ height: '400px', position: 'relative' }} className="border-t border-slate">
          <FlowingMenu items={demoItems} />
        </div>
      </section>

      {/* 4. Hours and Qualities Section */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto py-24 bg-mist/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Opening Hours Ticket */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm drop-shadow-md hover:-translate-y-2 transition-transform duration-300 group">
              
              {/* Ticket Header */}
              <div className="bg-paper border border-slate rounded-t-xl p-8 relative z-10 text-center">
                <h3 className="text-2xl font-display font-bold text-ink uppercase tracking-widest">{t('home.openingHours', 'Opening Hours')}</h3>
                <p className="text-slate font-mono text-xs mt-2 uppercase tracking-[0.2em]">Pizza Town • Meise</p>
              </div>

              {/* Ticket Divider (Perforation) */}
              <div className="relative flex items-center h-8 bg-paper border-x border-slate">
                <div className="absolute -left-[1px] w-6 h-8 bg-mist/30 border border-slate border-l-0 rounded-r-full"></div>
                <div className="w-full h-0 border-t-2 border-dashed border-slate opacity-40 mx-8"></div>
                <div className="absolute -right-[1px] w-6 h-8 bg-mist/30 border border-slate border-r-0 rounded-l-full"></div>
              </div>

              {/* Ticket Body */}
              <div className="bg-paper border border-slate border-t-0 rounded-b-xl p-8 pt-4 relative z-10">
                <ul className="space-y-4 font-mono text-ink text-sm mt-4">
                  <li className="flex justify-between items-center group-hover:text-signal-red transition-colors">
                    <span>{t('location.monday', 'Monday')}</span>
                    <span className="font-bold">17:00 - 23:00</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>{t('location.tuesday', 'Tuesday')}</span>
                    <span className="font-bold">17:00 - 23:00</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>{t('location.wednesday', 'Wednesday')}</span>
                    <span className="font-bold">17:00 - 23:00</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>{t('location.thursday', 'Thursday')}</span>
                    <span className="font-bold">17:00 - 23:00</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>{t('location.friday', 'Friday')}</span>
                    <span className="font-bold">17:00 - 23:00</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>{t('location.saturday', 'Saturday')}</span>
                    <span className="font-bold">17:00 - 23:00</span>
                  </li>
                  <li className="flex justify-between items-center text-signal-red">
                    <span>{t('location.sunday', 'Sunday')}</span>
                    <span className="font-bold">16:00 - 23:00</span>
                  </li>
                </ul>
                
                {/* Barcode representation */}
                <div className="mt-10 pt-6 border-t border-slate/20 flex flex-col items-center">
                  <div className="h-12 w-full flex gap-[3px] justify-center opacity-70">
                    {/* Simulate barcode lines */}
                    {[...Array(28)].map((_, i) => (
                      <div key={i} className={`h-full bg-ink ${i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-2' : 'w-[2px]'}`}></div>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] mt-3 text-slate uppercase tracking-widest">Admits One • Always Fresh</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Qualities LineSidebar */}
          <div className="flex flex-col justify-center lg:pl-12">
             <span className="inline-block px-3 py-1 bg-paper border border-slate text-xs font-bold text-ink uppercase tracking-widest rounded-full mb-6 self-start">
               {t('home.qualityLabel', 'Nos Engagements')}
             </span>
             <h2 className="text-3xl font-bold font-display text-ink tracking-tight mb-12">
               {t('home.qualityTitle', "L'excellence à chaque commande")}
             </h2>
             <LineSidebar
                items={[
                  t('home.quality1', 'Ingrédients Premium'), 
                  t('home.delivery', 'Snelle levering (tot 1 uur)'), 
                  t('home.quality2', 'Four Traditionnel 450°C'), 
                  t('home.quality3', 'Service Exceptionnel'), 
                  t('home.quality4', 'Recettes Authentiques')
                ]}
                accentColor="var(--theme-signal-red)"
                textColor="var(--theme-slate)"
                markerColor="var(--theme-slate)"
                showIndex={true}
                showMarker={true}
                maxShift={20}
                fontSize={1.2}
                itemGap={24}
                className="w-full"
             />
          </div>

        </div>
      </section>

    </div>
  );
};

export default HomeView;
