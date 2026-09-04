import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', id: 'ENG', label: 'English', tKey: 'english' },
  { code: 'fr', id: 'FRA', label: 'French', tKey: 'french' },
  { code: 'nl', id: 'NLD', label: 'Dutch', tKey: 'dutch' },
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get current language object based on i18n active language
  const currentLangCode = i18n.language?.split('-')[0] || 'en';
  const currentLangObj = languages.find(lang => lang.code === currentLangCode) || languages[0];
  const currentLangId = currentLangObj.id;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-paper border border-mist text-slate hover:text-ink hover:border-slate transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-signal-red group"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold tracking-wide font-mono">{currentLangId}</span>
        
        {/* Subtle Vertical Divider */}
        <div className="h-4 w-px bg-mist group-hover:bg-slate transition-colors"></div>
        
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-paper border border-mist rounded-md shadow-lg py-2 z-50">
          <div className="px-3 py-1 mb-1 border-b border-mist pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate font-mono">
              {t('navbar.selectLanguage')}
            </span>
          </div>
          
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between group transition-colors ${
                currentLangCode === lang.code
                  ? 'bg-mist text-signal-red'
                  : 'text-slate hover:bg-mist hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium font-sans">{t(`navbar.${lang.tKey}`)}</span>
              </div>
              
              {currentLangCode === lang.code && (
                <Check className="w-4 h-4 text-signal-red" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
