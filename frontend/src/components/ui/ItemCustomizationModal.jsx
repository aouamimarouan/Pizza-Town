import React, { useState, useMemo } from 'react';
import { X, Check, MousePointer2, Info, Plus, ChevronRight, ChevronLeft, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CRUST_OPTIONS = [
  { id: 'classic', name: 'Classic', price: 0 },
  { id: 'deeppan', name: 'Deeppan', price: 1.0 },
  { id: 'cheesy', name: 'Cheesy crust', price: 1.5 },
];

const PIZZA_SIZES = [
  { id: 'small', name: 'sizeSmall', price: 11.95 },
  { id: 'medium', name: 'sizeMedium', price: 13.95 },
  { id: 'large', name: 'sizeLarge', price: 18.95 },
];

const EXTRA_TOPPINGS = [
  { group: 'Cheese', items: ['Fetakaas', 'Gorgonzola', 'Mozzarella', 'Extra kaas'] },
  { group: 'Veggies', items: ['Champignons', 'Ui', 'Paprika', 'Look', 'Olijven', 'Ananas', 'Maïs', 'Jalapenos', 'Tomaat'] },
  { group: 'Meat', items: ['Shoarmavlees', 'Salami', 'Pepperoni', 'Gehakt', 'Ham', 'Kip', 'Spek', 'Kebab', 'Meatballs'] },
  { group: 'Seafood', items: ['Tonijn', 'Ansjovis', 'Garnalen', 'Mosselen', 'Zalm', "Scampi's"] },
  { group: 'Sauces', items: ['Tomatensaus', 'Bolognesesaus', 'BBQ saus', 'Roomsaus', 'Currysaus'] },
];

const TOPPING_PRICE = 1.0;

const DEAL_CONFIGURATIONS = {
  'Deal 1': { pizzas: 1, pizzaSize: 'large', drinks: 2, starters: 1 },
  'Deal 2': { pizzas: 2, pizzaSize: 'small', drinks: 2, starters: 1 },
  'Deal 3': { pizzas: 1, pizzaSize: 'medium', drinks: 2, starters: 1 },
  'Deal 4': null, // Fixed bundle
  'Deal 5': { pastas: 1, drinks: 1, starters: 1 }
};

const ItemCustomizationModal = ({ item, allItems = [], onClose, handleAddToCart }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0); 
  
  // Standard Item State
  const [selectedCrust, setSelectedCrust] = useState(CRUST_OPTIONS[0]);
  const [selectedSize, setSelectedSize] = useState(PIZZA_SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState([]);

  // Deal Selection State
  const isDeal = item.category === 'Menu Deals';
  const dealConfig = DEAL_CONFIGURATIONS[item.name];
  
  const [dealPizzas, setDealPizzas] = useState([]); 
  const [dealDrinks, setDealDrinks] = useState([]);
  const [dealStarters, setDealStarters] = useState([]);
  const [dealPastas, setDealPastas] = useState([]);

  const [isCustomizingItem, setIsCustomizingItem] = useState(null); 

  const isPizza = item.category === 'Pizzas' || item.category === 'Half-Half Pizzas';

  const getOptions = (category) => allItems.filter(i => i.category === category);

  const totalPrice = useMemo(() => {
    if (isDeal) {
      let extraFees = 0;
      dealPizzas.forEach(p => {
        if (p.customizations?.crust?.price) extraFees += p.customizations.crust.price;
        if (p.customizations?.toppings?.length) extraFees += p.customizations.toppings.length * TOPPING_PRICE;
      });
      return (item.price || 0) + extraFees;
    }
    
    const basePrice = isPizza ? (PIZZA_SIZES.find(s => s.id === selectedSize.id)?.price || 11.95) : (item.price || 0);
    const toppingsPrice = selectedToppings.length * TOPPING_PRICE;
    return basePrice + selectedCrust.price + toppingsPrice;
  }, [item.price, isPizza, selectedSize, selectedCrust, selectedToppings, isDeal, dealPizzas]);

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
        cartItemId: `${item.id}-${Date.now()}`,
        customizations: {
          size: isPizza ? selectedSize : null,
          crust: selectedCrust,
          toppings: selectedToppings,
          subItems: isDeal ? [
            ...dealPizzas.map(p => ({ ...p, type: 'pizza' })),
            ...dealPastas.map(p => ({ ...p, type: 'pasta' })),
            ...dealStarters.map(s => ({ ...s, type: 'starter' })),
            ...dealDrinks.map(d => ({ ...d, type: 'drink' }))
          ] : null
        },
        totalPrice: totalPrice,
      };
      
      handleAddToCart(customizedItem);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      onClose();
    }
  };

  const renderStandardCustomization = () => (
    <div className="space-y-8">
      {isPizza && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white uppercase tracking-wider text-sm">{t('modal.lblSizeSelection')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PIZZA_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selectedSize.id === size.id
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-2 ring-red-500/20'
                    : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-200 dark:hover:border-stone-700'
                }`}
              >
                <span className={`font-bold ${selectedSize.id === size.id ? 'text-red-600 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'}`}>
                  {t(`modal.${size.name}`)}
                </span>
                <span className="text-sm text-stone-500 dark:text-stone-500 mt-1">€{size.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      
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
              <span className={`font-bold ${selectedCrust.id === crust.id ? 'text-red-600 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'}`}>{crust.name}</span>
              <span className="text-sm text-stone-500 dark:text-stone-500 mt-1">{crust.price === 0 ? t('modal.free') : `+€${crust.price.toFixed(2)}`}</span>
            </button>
          ))}
        </div>
      </section>

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
                    <span className={`text-sm font-medium ${selectedToppings.includes(topping) ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400'}`}>{topping}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderDealCustomization = () => {
    if (!dealConfig) return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-stone-500">
        <Check className="w-12 h-12 text-emerald-500 mb-4" />
        <p className="font-medium text-lg text-stone-900 dark:text-white">{item.description}</p>
        <p className="mt-2">{t('modal.dealIncluded')}</p>
      </div>
    );

    const steps = [];
    if (dealConfig.pizzas) steps.push({ id: 'pizza', label: t('modal.dealStepPizza'), count: dealConfig.pizzas });
    if (dealConfig.pastas) steps.push({ id: 'pasta', label: t('modal.dealStepPasta'), count: dealConfig.pastas });
    if (dealConfig.starters) steps.push({ id: 'starter', label: t('modal.dealStepStarter'), count: dealConfig.starters });
    if (dealConfig.drinks) steps.push({ id: 'drink', label: t('modal.dealStepDrink', { count: dealConfig.drinks }), count: dealConfig.drinks });

    const step = steps[currentStep];

    const isStepComplete = () => {
      if (step.id === 'pizza') return dealPizzas.length === step.count;
      if (step.id === 'pasta') return dealPastas.length === step.count;
      if (step.id === 'starter') return dealStarters.length === step.count;
      if (step.id === 'drink') return dealDrinks.length === step.count;
      return false;
    };

    const handleItemSelect = (option) => {
      if (step.id === 'pizza' || step.id === 'pasta') {
        setIsCustomizingItem(option);
      } else {
        const setState = step.id === 'starter' ? setDealStarters : setDealDrinks;
        setState(prev => {
          if (prev.length >= step.count) return prev;
          return [...prev, { name: option.name, item_id: option.item_id }];
        });
      }
    };

    const renderPizzaMiniModal = () => (
      <div className="absolute inset-0 z-[60] bg-white dark:bg-stone-900 p-6 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-xl font-bold dark:text-white">{isCustomizingItem.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold uppercase tracking-widest bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-0.5 rounded">
                {step.id === 'pizza' ? dealConfig.pizzaSize : 'PASTA'}
              </span>
            </div>
          </div>
          <button onClick={() => setIsCustomizingItem(null)} className="p-2 rounded-full bg-stone-100 dark:bg-stone-800"><X /></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
           <div className="space-y-8 pb-32">
              <section>
                <h5 className="font-bold text-sm text-stone-400 uppercase mb-4">{t('modal.crustSelection')}</h5>
                <div className="grid grid-cols-2 gap-2">
                  {CRUST_OPTIONS.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setSelectedCrust(c)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold ${selectedCrust.id === c.id ? 'border-red-500 bg-red-50 dark:bg-red-900/10 dark:text-red-400' : 'border-stone-100 dark:border-stone-800 dark:text-stone-400'}`}
                    >
                      {c.name} ({c.price === 0 ? 'FREE' : `+€${c.price.toFixed(2)}`})
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h5 className="font-bold text-sm text-stone-400 uppercase mb-4">{t('modal.extraToppings', { price: '1.00' })}</h5>
                {EXTRA_TOPPINGS.map(group => (
                   <div key={group.group} className="mb-4">
                      <p className="text-[10px] text-stone-400 font-bold uppercase mb-2 ml-1">{group.group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map(t => (
                          <button 
                            key={t}
                            onClick={() => toggleTopping(t)}
                            className={`p-2.5 rounded-lg border text-xs font-medium text-left ${selectedToppings.includes(t) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'border-stone-100 dark:border-stone-800 dark:text-stone-400'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                   </div>
                ))}
              </section>
           </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-stone-900 border-t dark:border-stone-800">
           <button 
             onClick={() => {
                const setState = step.id === 'pizza' ? setDealPizzas : setDealPastas;
                setState(prev => [...prev, { 
                  name: isCustomizingItem.name, 
                  item_id: isCustomizingItem.item_id,
                  customizations: { 
                    size: step.id === 'pizza' ? { id: dealConfig.pizzaSize, name: `size${dealConfig.pizzaSize.charAt(0).toUpperCase() + dealConfig.pizzaSize.slice(1)}` } : null,
                    crust: selectedCrust,
                    toppings: selectedToppings
                  }
                }]);
                setIsCustomizingItem(null);
                setSelectedCrust(CRUST_OPTIONS[0]);
                setSelectedToppings([]);
             }}
             className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg"
           >
             Confirm {isCustomizingItem.name}
           </button>
        </div>
      </div>
    );

    return (
      <div className="relative h-full flex flex-col">
        {isCustomizingItem && renderPizzaMiniModal()}
        <div className="flex gap-2 mb-8">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1.5 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800">
              <div className={`h-full transition-all duration-500 ${idx <= currentStep ? 'bg-red-600' : 'w-0'}`} />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white uppercase tracking-tight">{step.label}</h3>
          <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-full border border-red-200 dark:border-red-900/30">
             {(step.id === 'pizza' ? dealPizzas : (step.id === 'pasta' ? dealPastas : (step.id === 'starter' ? dealStarters : dealDrinks))).length} / {step.count}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-32">
           {getOptions(step.id === 'pizza' ? 'Pizzas' : (step.id === 'pasta' ? 'Pastas' : (step.id === 'starter' ? 'Starters' : 'Drinks'))).map(option => (
             <button
               key={option.item_id}
               onClick={() => handleItemSelect(option)}
               className={`group p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col h-full bg-white dark:bg-stone-900 ${
                 (step.id === 'pizza' ? dealPizzas : (step.id === 'pasta' ? dealPastas : (step.id === 'starter' ? dealStarters : dealDrinks))).some(d => d.item_id === option.item_id)
                   ? 'border-red-500 ring-2 ring-red-500/10'
                   : 'border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700'
               }`}
             >
               <span className="font-bold text-sm dark:text-white group-hover:text-red-500 transition-colors line-clamp-2">{option.name}</span>
             </button>
           ))}
        </div>

        <div className="mt-auto pt-6 flex justify-between items-center bg-white dark:bg-stone-900">
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 dark:hover:text-white">
              <ChevronLeft /> <span>Back</span>
            </button>
          )}
          {isStepComplete() ? (
            currentStep < steps.length - 1 ? (
              <button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="ml-auto flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg"
              >
                <span>Next Step</span> <ChevronRight />
              </button>
            ) : (
                <button 
                  onClick={handleConfirm}
                  className="ml-auto flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
                >
                  <ShoppingCart /> <span>Add to Cart</span>
                </button>
            )
          ) : (
            <div className="ml-auto text-stone-400 text-sm font-medium italic">{t('modal.dealSelectPrompt')}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-100 dark:border-stone-800">
        <div className="px-6 py-4 border-b dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white uppercase tracking-tight">{item.name}</h2>
            {isDeal && <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 inline-block px-2 py-0.5 rounded mt-1">COMBO DEAL</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500"><X /></button>
        </div>
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
           {isDeal ? renderDealCustomization() : renderStandardCustomization()}
        </div>
        {!isDeal && (
          <div className="p-6 border-t dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50">
            <button onClick={handleConfirm} className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-between">
              <span>{t('modal.confirmBtn')}</span>
              <span className="bg-red-700/50 px-3 py-1 rounded-lg">€{totalPrice.toFixed(2)}</span>
            </button>
          </div>
        )}
        {isDeal && (
          <div className="p-4 bg-stone-900 text-white flex justify-between items-center px-8 border-t border-stone-800">
             <div className="flex flex-col">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none mb-1">Total Deal Price</span>
                <span className="text-xl font-black text-red-500">€{totalPrice.toFixed(2)}</span>
             </div>
             <div className="text-[10px] text-stone-500 text-right">Includes deal base + customization surcharges.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCustomizationModal;
