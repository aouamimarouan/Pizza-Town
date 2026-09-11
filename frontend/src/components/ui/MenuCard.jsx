import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEAL_CONFIGS } from './ItemCustomizationModal';

// Helper to safely highlight text without dangerouslySetInnerHTML if possible, 
// but using dangerouslySetInnerHTML is easiest for simple substring matches if sanitized.
// We'll just use a simple regex split for React nodes to be safe.
const HighlightedText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="bg-mist text-signal-red px-0.5 rounded-sm">{part}</span> : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const isCustomizable = (item) => {
  if (item.category === 'Pizzas') return true;
  if (item.category === 'Menu Deals') {
    const config = DEAL_CONFIGS[item.name];
    return config && config.components && config.components.length > 0;
  }
  return false;
};

// Reliable category fallback photos so no card is ever empty or broken
const CATEGORY_FALLBACKS = {
  'Drinks': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  'Pizzas': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  'Pastas': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&auto=format&fit=crop&q=80',
  'Salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  'Starters': 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80',
  'Menu Deals': 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&auto=format&fit=crop&q=80',
  'Sauces': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&auto=format&fit=crop&q=80',
};

const getCategoryFallback = (category) => {
  return CATEGORY_FALLBACKS[category] || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
};

const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return encodeURI(path);
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return encodeURI(cleanPath);
};

const MenuCard = ({ item, handleAddToCart, openModal, searchQuery = '', priority = false }) => {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);

  const imageSrc = resolveImageUrl(item.image_url) || getCategoryFallback(item.category);

  return (
    <div 
      onClick={() => {
        if (isCustomizable(item)) {
          openModal(item);
        } else {
          handleAddToCart(item);
        }
      }}
      className="bg-paper rounded-lg border border-slate flex flex-col h-full cursor-pointer transition-transform duration-150 ease-out hover:-translate-y-1 hover:shadow-md group overflow-hidden"
    >
      {/* Product Photo Top Area */}
      <div className="aspect-video bg-mist w-full relative border-b border-mist overflow-hidden">
        {/* Skeleton Placeholder */}
        <div 
          className={`absolute inset-0 bg-slate/20 animate-pulse transition-opacity duration-500 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
        />
        <img 
          src={imageSrc} 
          alt={item.name} 
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            setIsLoaded(true);
            e.currentTarget.onerror = null;
            e.currentTarget.src = getCategoryFallback(item.category);
          }}
          className={`w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.02] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.popular && (
            <span className="text-[10px] uppercase tracking-widest font-bold bg-paper text-ink px-2 py-1 rounded-sm border border-slate">
              {t('card.popular')}
            </span>
          )}
          {item.vegetarian && (
            <span className="text-[10px] uppercase tracking-widest font-bold bg-mist text-ink px-2 py-1 rounded-sm border border-slate">
              {t('card.vegetarian')}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-lg font-bold font-sans text-ink leading-snug">
            <HighlightedText text={item.name} highlight={searchQuery} />
          </h3>
          {item.description && (
             <p className="text-sm text-slate mt-2 leading-relaxed">
               <HighlightedText text={item.description} highlight={searchQuery} />
             </p>
          )}
        </div>

        {/* Footer Area: Price & Action */}
        <div className="mt-6 flex justify-between items-end border-t border-mist pt-4">
          <span className="text-ink font-bold font-mono text-xl">
            €{item.price.toFixed(2)}
          </span>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (isCustomizable(item)) {
                openModal(item);
              } else {
                handleAddToCart(item);
              }
            }}
            className={
              isCustomizable(item)
                ? "bg-paper text-ink border border-slate font-bold text-sm px-4 py-2 rounded-md hover:bg-mist transition-colors duration-150"
                : "bg-signal-red text-paper font-bold text-sm px-4 py-2 rounded-md hover:bg-ink transition-colors duration-150"
            }
            aria-label={t('card.addCart', { name: item.name })}
          >
            {isCustomizable(item) ? 'Customize' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;