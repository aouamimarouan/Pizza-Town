import React from 'react';
import { MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LocationView = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">{t('location.title')}</h2>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-lg">{t('location.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Contact Details Left Column */}
        <div className="space-y-8">
          
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 space-y-6">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4">{t('location.contactInfo')}</h3>
            
            <div className="space-y-4">
              <a href="tel:022697176" className="flex items-center text-stone-700 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center mr-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors border border-transparent dark:border-stone-800">
                  <Phone className="h-5 w-5 text-stone-500 dark:text-stone-400 group-hover:text-red-500 dark:group-hover:text-red-400" />
                </div>
                <span className="font-medium text-lg">02 269 71 76</span>
              </a>

              <a href="mailto:contact@pizzatown.be" className="flex items-center text-stone-700 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center mr-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors border border-transparent dark:border-stone-800">
                  <Mail className="h-5 w-5 text-stone-500 dark:text-stone-400 group-hover:text-red-500 dark:group-hover:text-red-400" />
                </div>
                <span className="font-medium text-lg">contact@pizzatown.be</span>
              </a>

              <a href="#" className="flex items-center text-stone-700 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center mr-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors border border-transparent dark:border-stone-800">
                  <Instagram className="h-5 w-5 text-stone-500 dark:text-stone-400 group-hover:text-red-500 dark:group-hover:text-red-400" />
                </div>
                <span className="font-medium text-lg">@PizzaTownMeise</span>
              </a>

              <div className="flex items-center text-stone-700 dark:text-stone-300">
                <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center mr-4 border border-transparent dark:border-stone-800">
                  <MapPin className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                </div>
                <span className="font-medium text-lg">Stationsstraat 14, 1861 Meise, Belgium</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700">
            <h3 className="text-xl font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-stone-400 dark:text-stone-500" />
              {t('location.openingHours')}
            </h3>
            
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <span className="font-medium">{t('location.monday')}</span>
                <span>17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <span className="font-medium">{t('location.tuesday')}</span>
                <span>17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <span className="font-medium">{t('location.wednesday')}</span>
                <span>17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <span className="font-medium">{t('location.thursday')}</span>
                <span>17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <span className="font-medium">{t('location.friday')}</span>
                <span>17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center text-stone-700 dark:text-stone-300">
                <span className="font-medium">{t('location.saturday')}</span>
                <span>17:00 - 23:00</span>
              </li>
              <li className="flex justify-between items-center text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-950 p-2 rounded-lg mt-2 font-bold border border-transparent dark:border-stone-800">
                <span>{t('location.sunday')}</span>
                <span>16:00 - 23:00</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Map Right Column */}
        <div className="h-full min-h-[400px] lg:min-h-full w-full bg-stone-200 dark:bg-stone-800 rounded-3xl overflow-hidden relative shadow-inner border border-stone-300 dark:border-stone-700 transition-colors flex">
           <iframe 
             src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2513.844787948216!2d4.326315515748957!3d50.9382189795454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3c1b82fb32ed3%3A0xc3f1912f275e6d62!2sStationsstraat%2014%2C%201861%20Meise%2C%20Belgium!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus" 
             className="w-full h-full min-h-[400px] border-0" 
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
