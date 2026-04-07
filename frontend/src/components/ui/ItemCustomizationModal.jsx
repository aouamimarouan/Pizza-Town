import React, { useState, useMemo } from 'react';
import { X, Check, MousePointer2, Info, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CRUST_OPTIONS = [
  { id: 'classic', name: 'Classic', price: 0 },
  { id: 'deeppan', name: 'Deeppan', price: 1.0 },
  { id: 'cheesy', name: 'Cheesy crust', price: 1.5 },
];

const EXTRA_TOPPINGS = [
  { group: 'Cheese', items: ['Fetakaas', 'Gorgonzola', 'Mozzarella', 'Extra kaas'] },
  { group: 'Veggies', items: ['Champignons', 'Ui', 'Paprika', 'Look', 'Olijven', 'Ananas', 'Maïs', 'Jalapenos', 'Tomaat'] },
  { group: 'Meat', items: ['Shoarmavlees', 'Salami', 'Pepperoni', 'Gehakt', 'Ham', 'Kip', 'Spek', 'Kebab', 'Meatballs'] },
  { group: 'Seafood', items: ['Tonijn', 'Ansjovis', 'Garnalen', 'Mosselen', 'Zalm', "Scampi's"] },
  { group: 'Sauces', items: ['Tomatensaus', 'Bolognesesaus', 'BBQ saus', 'Roomsaus', 'Currysaus'] },
];

const TOPPING_PRICE = 1.0;

const ItemCustomizationModal = ({ item, onClose, handleAddToCart }) => {
  const { t } = useTranslation();
  const [selectedCrust, setSelectedCrust] = useState(CRUST_OPTIONS[0]);
  const [selectedToppings, setSelectedToppings] = useState([]);

  const totalPrice = useMemo(() => {
    let basePrice = item.price || 0;
    if (item.selectedVariant) {
      basePrice += item.selectedVariant.priceModifier || 0;
    }
    const toppingsPrice = selectedToppings.length * TOPPING_PRICE;
    return basePrice + selectedCrust.price + toppingsPrice;
  }, [item.price, item.selectedVariant, selectedCrust, selectedToppings]);

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  const handleConfirm = () => {
    try {
      const customizedItem = {
        ...item,
        cartItemId: `${item.id}-${Date.now()}`, // Unique ID for each customization
        customizations: {
          crust: selectedCrust,
          toppings: selectedToppings,
        },
        totalPrice: totalPrice,
      };
      
      handleAddToCart(customizedItem);
    } catch (err) {
      console.error('Failed to add customized item to cart:', err);
    } finally {
      // Force close the modal immediately
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">{item.name}</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">{t('modal.subtitle')}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Crust Selection */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MousePointer2 className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-white uppercase tracking-wider text-sm">{t('modal.crustSelection')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CRUST_OPTIONS.map((crust) => (
                <button
                  key={crust.id}
                  onClick={() => setSelectedCrust(crust)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedCrust.id === crust.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-2 ring-red-500/20'
                      : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-200 dark:hover:border-stone-700'
                  }`}
                >
                  <span className={`font-bold ${selectedCrust.id === crust.id ? 'text-red-600 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'}`}>
                    {crust.name}
                  </span>
                  <span className="text-sm text-stone-500 dark:text-stone-500 mt-1">
                    {crust.price === 0 ? t('modal.free') : `+€${crust.price.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Extra Toppings */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-white uppercase tracking-wider text-sm">{t('modal.extraToppings', { price: TOPPING_PRICE.toFixed(2) })}</h3>
            </div>
            
            <div className="space-y-6">
              {EXTRA_TOPPINGS.map((group) => (
                <div key={group.group}>
                  <h4 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-3 tracking-widest">{group.group}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.items.map((topping) => (
                      <label
                        key={topping}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedToppings.includes(topping)
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                            : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedToppings.includes(topping)}
                            onChange={() => toggleTopping(topping)}
                            className="peer appearance-none w-5 h-5 rounded-md border-2 border-stone-200 dark:border-stone-700 checked:bg-emerald-500 checked:border-emerald-500 transition-all duration-200"
                          />
                          <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className={`text-sm font-medium ${selectedToppings.includes(topping) ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400'}`}>
                          {topping}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer / Action */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50">
          <button
            onClick={handleConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-red-600/20 transition-all duration-200 flex items-center justify-between"
          >
            <span>{t('modal.confirmBtn')}</span>
            <span className="bg-red-700/50 px-3 py-1 rounded-lg">€{totalPrice.toFixed(2)}</span>
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-stone-400 dark:text-stone-500 text-xs">
            <Info className="w-3.5 h-3.5" />
            <span>{t('modal.deliveryNote')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCustomizationModal;
