import React from 'react';
import { Plus } from 'lucide-react';

const MenuCard = ({ item, handleAddToCart, openModal }) => {
  return (
    // Added 'overflow-hidden' here so the image respects the card's rounded corners
    <div 
      onClick={() => {
        if (['Pizzas', 'Half-Half Pizzas', 'Menu Deals'].includes(item.category)) {
          openModal(item);
        }
      }}
      className="bg-stone-900 border border-stone-800 rounded-xl p-5 transition-all duration-300 hover:border-stone-600 group flex flex-col h-full cursor-pointer relative"
    >
      {/* Popular/Vegetarian Tags */}
      <div className="flex gap-2 mb-3">
        {item.popular && (
          <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-900/20 text-amber-500 border border-amber-900/50 px-2 py-0.5 rounded">
            Popular
          </span>
        )}
        {item.vegetarian && (
          <span className="text-[10px] uppercase tracking-widest font-bold bg-emerald-900/20 text-emerald-500 border border-emerald-900/50 px-2 py-0.5 rounded">
            Vegetarian
          </span>
        )}
      </div>

      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition-colors duration-300">
            {item.name}
          </h3>
          <p className="text-sm text-stone-400 mt-2 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 flex justify-between items-center">
        <span className="text-red-500 font-semibold text-lg">
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
          className="bg-stone-800 hover:bg-red-600 text-white p-2.5 rounded-lg transition-all duration-300 shadow-lg shadow-black/20"
          aria-label={`Add ${item.name} to cart`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MenuCard;