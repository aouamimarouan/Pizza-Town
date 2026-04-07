import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PizzaProduct, PizzaVariant } from '../../types';

interface PizzaCardProps {
  item: PizzaProduct;
  handleAddToCart?: (item: any) => void;
  openModal?: (item: any, variant?: PizzaVariant) => void;
}

export const PizzaCard: React.FC<PizzaCardProps> = ({ item, handleAddToCart, openModal }) => {
  const { t } = useTranslation();
  
  // By default, no variant is selected
  const [selectedVariant, setSelectedVariant] = useState<PizzaVariant | null>(
    item.variants?.length === 1 ? item.variants[0] : null
  );

  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      return item.price + selectedVariant.priceModifier;
    }
    return item.price;
  }, [item.price, selectedVariant]);

  const onActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Require variant selection if there are multiple variants
    if (item.variants && item.variants.length > 0 && !selectedVariant) {
      alert("Please select a size first."); // Replace with a toast if your app uses toast universally
      return;
    }

    if (openModal) {
      // Pass the fully assembled item with its variant, or just pass variant as a second param.
      // E.g., openModal({ ...item, selectedVariant })
      openModal({ ...item, selectedVariant });
    } else if (handleAddToCart) {
      handleAddToCart({ ...item, selectedVariant });
    }
  };

  return (
    <div 
      onClick={() => openModal && onActionClick({ stopPropagation: () => {} } as any)}
      className="bg-stone-900 border border-stone-800 rounded-xl p-4 md:p-5 transition-all duration-300 hover:border-stone-600 group flex flex-col justify-between h-full cursor-pointer relative"
    >
      <div className="flex flex-col flex-1 pb-4">
        {/* Tags */}
        <div className="flex gap-2 mb-2 md:mb-3">
          {item.popular && (
            <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-900/20 text-amber-500 border border-amber-900/50 px-2 py-0.5 rounded">
              {t('card.popular', 'Popular')}
            </span>
          )}
          {item.vegetarian && (
            <span className="text-[10px] uppercase tracking-widest font-bold bg-emerald-900/20 text-emerald-500 border border-emerald-900/50 px-2 py-0.5 rounded">
              {t('card.vegetarian', 'Vegetarian')}
            </span>
          )}
        </div>

        <h3 className="text-base md:text-lg font-bold text-white group-hover:text-red-500 transition-colors duration-300 line-clamp-2 md:line-clamp-none">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs md:text-sm text-stone-400 mt-1 md:mt-2 leading-relaxed line-clamp-2 md:line-clamp-none">
            {item.description}
          </p>
        )}

        {/* Size Selection */}
        {item.variants && item.variants.length > 0 && (
          <div className="mt-4 flex gap-2 w-full bg-stone-950 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
            {item.variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(variant);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex justify-between items-center border-t border-stone-800">
        <div className="flex flex-col">
          {!selectedVariant && item.variants && item.variants.length > 1 && (
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold mb-0.5">
              From
            </span>
          )}
          <span className="text-red-500 font-bold text-lg md:text-xl">
            €{currentPrice.toFixed(2)}
          </span>
        </div>
        
        <button 
          onClick={onActionClick}
          className="bg-stone-800 hover:bg-red-600 text-white p-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-black/20"
          aria-label={t('card.addCart', { name: item.name })}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PizzaCard;
