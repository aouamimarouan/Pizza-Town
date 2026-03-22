import React from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-stone-900 text-stone-300 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand & Address */}
        <div className="space-y-4">
          <h3 className="font-heading font-extrabold text-2xl text-white tracking-tighter">
            Pizza Town
          </h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center text-stone-400">
              <MapPin className="h-4 w-4 mr-2" />
              Stationsstraat 14, 1861 Meise, Belgium
            </p>
            <p className="flex items-center text-stone-400">
              <Phone className="h-4 w-4 mr-2" />
              02 269 71 76
            </p>
            <p className="flex items-center text-stone-400">
              <Mail className="h-4 w-4 mr-2" />
              contact@pizzatown.be
            </p>
          </div>
        </div>

        {/* Hours */}
        <div className="space-y-4">
          <h4 className="font-heading font-semibold text-lg text-white">{t('footer.openingHours')}</h4>
          <ul className="space-y-2 text-sm text-stone-400">
            <li className="flex justify-between border-b border-stone-800 pb-1">
              <span>{t('footer.monSat')}</span>
              <span>17:00 - 23:00</span>
            </li>
            <li className="flex justify-between border-b border-stone-800 pb-1 text-amber-500 font-medium">
              <span>{t('footer.sun')}</span>
              <span>16:00 - 23:00</span>
            </li>
          </ul>
        </div>

        {/* Social & Message */}
        <div className="space-y-4 md:text-right">
          <h4 className="font-heading font-semibold text-lg text-white">{t('footer.followUs')}</h4>
          <div className="flex space-x-4 md:justify-end">
             <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:bg-red-600 hover:text-white transition-all duration-300">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:bg-red-600 hover:text-white transition-all duration-300">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-6 text-sm italic text-stone-500">
            {t('footer.thankYou')}
          </p>
        </div>
      
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-800 text-center text-xs text-stone-500">
        <p>&copy; {new Date().getFullYear()} Pizza Town Meise. {t('footer.rights')}</p>
      </div>
    </footer>
  );
};

export default Footer;
