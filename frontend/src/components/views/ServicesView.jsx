import React from 'react';
import { Truck, ShoppingBag, UtensilsCrossed, Music, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ServicesView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const services = [
    {
      id: 'delivery',
      title: t('services.delivery'),
      description: t('services.deliveryDesc'),
      icon: Truck,
      actionText: t('services.deliveryAction'),
      link: '/menu',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      id: 'takeaway',
      title: t('services.takeaway'),
      description: t('services.takeawayDesc'),
      icon: ShoppingBag,
      actionText: t('services.takeawayAction'),
      link: '/menu',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 'dine-in',
      title: t('services.dineIn'),
      description: t('services.dineInDesc'),
      icon: UtensilsCrossed,
      actionText: t('services.dineInAction'),
      link: '/book',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 transition-colors font-sans text-stone-300">
      
      {/* Header Section */}
      <div className="text-center mb-20">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4 font-heading">
          {t('services.title')} <span className="text-red-600">{t('services.titleAccent')}</span>
        </h1>
        <p className="text-stone-400 text-lg max-w-2xl mx-auto">
          {t('services.description')}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-20 max-w-5xl mx-auto">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div 
              key={service.id}
              className="group bg-stone-900 border border-stone-800 rounded-3xl p-8 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full shadow-2xl shadow-black/40"
            >
              <div className={`w-14 h-14 rounded-2xl ${service.bgColor} ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{service.title}</h3>
              <p className="text-stone-500 mb-8 flex-grow leading-relaxed">
                {service.description}
              </p>
              
              <button 
                onClick={() => {
                  if (service.link.startsWith('#')) {
                    document.querySelector(service.link)?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate(service.link);
                  }
                }}
                className="w-full inline-flex items-center justify-between px-6 py-4 rounded-xl bg-stone-800 hover:bg-red-600 text-white font-bold transition-all group-hover:shadow-lg group-hover:shadow-red-900/20"
              >
                <span>{service.actionText}</span>
                <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Banner - Centered at the bottom */}
      <div className="flex justify-center">
        <div className="max-w-xl w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all hover:bg-amber-500/15">
          <div className="w-12 h-12 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-widest text-xs mb-1">{t('services.paymentOptions')}</h4>
            <p className="text-stone-400 text-sm">
              {t('services.paymentDesc')}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ServicesView;