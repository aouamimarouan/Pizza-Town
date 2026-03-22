import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', id: 'ENG', label: 'English', tKey: 'english', flag: '🇺🇸' },
  { code: 'fr', id: 'FRA', label: 'French', tKey: 'french', flag: '🇫🇷' },
  { code: 'nl', id: 'NLD', label: 'Dutch', tKey: 'dutch', flag: '🇳🇱' },
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-200 focus:outline-none group"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold tracking-wide">{currentLangId}</span>
        
        {/* Subtle Vertical Divider */}
        <div className="h-4 w-[1px] bg-stone-300 dark:bg-stone-700 group-hover:bg-red-300/50 dark:group-hover:bg-red-800/50 transition-colors"></div>
        
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">
              {t('navbar.selectLanguage')}
            </span>
          </div>
          
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between group transition-colors ${
                currentLangCode === lang.code
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{t(`navbar.${lang.tKey}`)}</span>
              </div>
              
              {currentLangCode === lang.code && (
                <Check className="w-4 h-4 text-red-500 dark:text-red-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
