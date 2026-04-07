import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MenuCard = ({ item, handleAddToCart, openModal }) => {
  const { t } = useTranslation();
  return (
    // Added 'overflow-hidden' here so the image respects the card's rounded corners
    <div 
      onClick={() => {
        if (['Pizzas', 'Half-Half Pizzas', 'Menu Deals'].includes(item.category)) {
          openModal(item);
        }
      }}
      className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl p-4 md:p-5 transition-all duration-300 hover:border-stone-200 dark:hover:border-stone-600 group flex flex-row md:flex-col justify-between items-center md:items-stretch h-full cursor-pointer relative shadow-sm"
    >
      <div className="flex flex-col flex-1 pr-4 md:pr-0 md:h-full justify-center md:justify-start">
        {/* Popular/Vegetarian Tags */}
        <div className="flex gap-2 mb-2 md:mb-3">
          {item.popular && (
            <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded">
              {t('card.popular')}
            </span>
          )}
          {item.vegetarian && (
            <span className="text-[10px] uppercase tracking-widest font-bold bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded">
              {t('card.vegetarian')}
            </span>
          )}
        </div>

        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-stone-900 dark:text-white group-hover:text-red-500 transition-colors duration-300 line-clamp-2 md:line-clamp-none">
              {item.name}
            </h3>
            {item.description && (
               <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1 md:mt-2 leading-relaxed line-clamp-2 md:line-clamp-none">
                 {item.description}
               </p>
            )}
          </div>
        </div>

        <div className="mt-2 md:mt-auto md:pt-6 flex justify-between items-center">
          <span className="text-red-600 font-bold text-base md:text-lg">
            €{item.price.toFixed(2)}
          </span>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (['Pizzas', 'Half-Half Pizzas', 'Menu Deals'].includes(item.category)) {
                openModal(item);
              } else {
                handleAddToCart(item);
              }
            }}
            className="hidden md:flex bg-stone-100 dark:bg-stone-800 hover:bg-red-600 dark:hover:bg-red-600 text-stone-600 dark:text-white p-2.5 rounded-lg transition-all duration-300"
            aria-label={t('card.addCart', { name: item.name })}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="md:hidden flex-shrink-0 flex items-center justify-center">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (['Pizzas', 'Half-Half Pizzas', 'Menu Deals'].includes(item.category)) {
              openModal(item);
            } else {
              handleAddToCart(item);
            }
          }}
          className="bg-stone-100 dark:bg-stone-800 hover:bg-red-600 dark:hover:bg-red-600 text-stone-600 dark:text-white p-2.5 rounded-lg transition-all duration-300"
          aria-label={t('card.addCart', { name: item.name })}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MenuCard;