import React from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-paper text-slate py-12 px-4 sm:px-6 lg:px-8 mt-auto border-t border-mist transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand & Address */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-2xl text-ink tracking-tight uppercase">
            Pizza Town
          </h3>
          <div className="space-y-2 text-sm font-sans">
            <p className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-signal-red" />
              Stationsstraat 14, 1861 Meise, Belgium
            </p>
            <p className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-signal-red" />
              02 269 71 76
            </p>
            <p className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-signal-red" />
              contact@pizzatown.be
            </p>
          </div>
        </div>

        {/* Hours */}
        <div className="space-y-4">
          <h4 className="font-display font-bold text-lg text-ink uppercase tracking-wider">{t('footer.openingHours')}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border-b border-mist pb-1">
              <span className="font-sans">{t('footer.monSat')}</span>
              <span className="font-mono text-ink">17:00 - 23:00</span>
            </li>
            <li className="flex justify-between border-b border-mist pb-1 text-signal-red font-bold">
              <span className="font-sans">{t('footer.sun')}</span>
              <span className="font-mono">17:00 - 23:00</span>
            </li>
          </ul>
        </div>

        {/* Social & Message */}
        <div className="space-y-4 md:text-right">
          <h4 className="font-display font-bold text-lg text-ink uppercase tracking-wider">{t('footer.followUs')}</h4>
          <div className="flex space-x-4 md:justify-end">
             <a href="#" className="h-10 w-10 flex items-center justify-center rounded-md bg-mist text-slate hover:bg-signal-red hover:text-white border border-slate transition-colors duration-150">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-md bg-mist text-slate hover:bg-signal-red hover:text-white border border-slate transition-colors duration-150">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-6 text-sm font-sans text-slate">
            {t('footer.thankYou')}
          </p>
        </div>
      
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-mist text-center text-xs font-sans text-slate">
        <p>&copy; {new Date().getFullYear()} Pizza Town Meise. {t('footer.rights')}</p>
      </div>
    </footer>
  );
};

export default Footer;
