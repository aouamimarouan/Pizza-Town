import React from 'react';
import { Plus } from 'lucide-react';

const MenuCard = ({ item, handleAddToCart }) => {
  return (
    // Added 'overflow-hidden' here so the image respects the card's rounded corners
    <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700 flex flex-col h-full group hover:bg-stone-50 dark:hover:bg-stone-800/50 relative overflow-hidden">
      
      {/* Edge-to-edge Image at the top */}
      <img 
        src={item.image} 
        alt={item.name} 
        className="w-full h-48 object-cover"
      />

      {/* Inner Content Wrapper (Padding moved here) */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors pr-10">
            {item.name}
          </h3>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-sm border border-emerald-100 dark:border-emerald-800/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors ml-4 shrink-0">
            €{item.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6 flex-grow transition-colors">
          {item.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex flex-wrap gap-2">
            {item.popular && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 transition-colors">
                Popular
              </span>
            )}
            {item.vegetarian && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors">
                Vegetarian
              </span>
            )}
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
            className="flex items-center justify-center bg-stone-100 dark:bg-stone-800 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white text-stone-900 dark:text-white p-2 rounded-xl transition-all duration-200 group-hover:ring-2 ring-red-100 dark:ring-red-900/20 shrink-0"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default MenuCard;