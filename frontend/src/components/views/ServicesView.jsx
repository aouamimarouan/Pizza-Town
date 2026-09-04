import React from 'react';
import { Truck, ShoppingBag, UtensilsCrossed, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SpecularButton from '../ui/SpecularButton';

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
    },
    {
      id: 'takeaway',
      title: t('services.takeaway'),
      description: t('services.takeawayDesc'),
      icon: ShoppingBag,
      actionText: t('services.takeawayAction'),
      link: '/menu',
    },
    {
      id: 'dine-in',
      title: t('services.dineIn'),
      description: t('services.dineInDesc'),
      icon: UtensilsCrossed,
      actionText: t('services.dineInAction'),
      link: '/book',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 transition-colors font-sans">
      
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight uppercase mb-4 font-display">
          {t('services.title')} <span className="text-signal-red">{t('services.titleAccent')}</span>
        </h1>
        <p className="text-slate text-lg max-w-2xl mx-auto font-sans">
          {t('services.description')}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div 
              key={service.id}
              className="bg-paper border border-mist hover:border-signal-red rounded-md p-8 transition-colors flex flex-col h-full shadow-sm"
            >
              <div className="w-12 h-12 rounded-sm bg-mist text-ink flex items-center justify-center mb-6 border border-slate">
                <Icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold font-display text-ink mb-3 tracking-tight">{service.title}</h3>
              <p className="text-slate mb-8 flex-grow leading-relaxed font-sans">
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
                className="w-full text-center px-6 py-3 rounded-md bg-mist hover:bg-signal-red hover:text-white text-ink border border-slate hover:border-signal-red font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal-red"
              >
                {service.actionText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Banner - Centered at the bottom */}
      <div className="flex justify-center">
        <div className="max-w-xl w-full bg-mist border border-slate rounded-md p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-colors">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-paper border border-slate flex items-center justify-center text-ink">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-ink uppercase tracking-widest text-xs mb-1 font-sans">{t('services.paymentOptions')}</h4>
            <p className="text-slate text-sm font-sans">
              {t('services.paymentDesc')}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ServicesView;