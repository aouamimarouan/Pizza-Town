import React from 'react';
import { useTranslation } from 'react-i18next';

const LocationView = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-4xl font-bold font-display text-ink tracking-tight">{t('location.title')}</h2>
        <p className="text-slate font-sans mt-2 text-lg">{t('location.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Contact Details Left Column */}
        <div className="space-y-6">
          
          <div className="bg-mist rounded-md p-8 border border-slate space-y-6">
            <h3 className="text-xl font-bold font-display text-ink border-b border-slate pb-4">{t('location.contactInfo')}</h3>
            
            <div className="space-y-4 font-sans text-ink">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate uppercase tracking-widest mb-1">Phone</span>
                <a href="tel:022697176" className="font-mono text-lg hover:text-signal-red transition-colors">
                  02 269 71 76
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate uppercase tracking-widest mb-1">Email</span>
                <a href="mailto:contact@pizzatown.be" className="text-lg hover:text-signal-red transition-colors">
                  contact@pizzatown.be
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate uppercase tracking-widest mb-1">Social</span>
                <a href="#" className="text-lg hover:text-signal-red transition-colors">
                  @PizzaTownMeise
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate uppercase tracking-widest mb-1">Address</span>
                <span className="text-lg">
                  Stationsstraat 14, 1861 Meise, Belgium
                </span>
              </div>
            </div>
          </div>

          <div className="bg-mist rounded-md p-8 border border-slate">
            <h3 className="text-xl font-bold font-display text-ink border-b border-slate pb-4 mb-6">
              {t('location.openingHours')}
            </h3>
            
            <ul className="space-y-3 font-sans">
              <li className="flex justify-between items-center border-b border-slate/30 pb-2">
                <span className="text-slate">{t('location.monday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate/30 pb-2">
                <span className="text-slate">{t('location.tuesday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate/30 pb-2">
                <span className="text-slate">{t('location.wednesday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate/30 pb-2">
                <span className="text-slate">{t('location.thursday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate/30 pb-2">
                <span className="text-slate">{t('location.friday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate/30 pb-2">
                <span className="text-slate">{t('location.saturday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center bg-paper p-3 rounded-sm border border-slate mt-4">
                <span className="font-bold text-signal-red">{t('location.sunday')}</span>
                <span className="font-mono text-ink font-bold">17:00 - 23:00</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Map Right Column */}
        <div className="h-full min-h-[500px] w-full bg-mist rounded-md overflow-hidden relative border border-slate p-2 flex">
           <iframe 
             src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2513.844787948216!2d4.326315515748957!3d50.9382189795454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3c1b82fb32ed3%3A0xc3f1912f275e6d62!2sStationsstraat%2014%2C%201861%20Meise%2C%20Belgium!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus" 
             className="w-full h-full rounded-sm border-0" 
             allowFullScreen="" 
             loading="lazy" 
             referrerPolicy="no-referrer-when-downgrade"
             title="Pizza Town Location"
           ></iframe>
        </div>

      </div>
    </div>
  );
};

export default LocationView;
