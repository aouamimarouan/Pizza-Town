import React, { useState, useMemo, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SpecularButton from './SpecularButton';

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

export const DEAL_CONFIGS = {
  'Deal 1': {
    components: [
      { type: 'pizza', labelKey: 'deal.selectLargePizza', size: 'large' },
      { type: 'drink', labelKey: 'deal.selectDrink1' },
      { type: 'drink', labelKey: 'deal.selectDrink2' },
      { type: 'starter', labelKey: 'deal.selectStarter' }
    ]
  },
  'Deal 2': {
    components: [
      { type: 'pizza', labelKey: 'deal.selectSmallPizza1', size: 'small' },
      { type: 'pizza', labelKey: 'deal.selectSmallPizza2', size: 'small' },
      { type: 'drink', labelKey: 'deal.selectDrink1' },
      { type: 'drink', labelKey: 'deal.selectDrink2' },
      { type: 'starter', labelKey: 'deal.selectStarter' }
    ]
  },
  'Deal 3': {
    components: [
      { type: 'pizza', labelKey: 'deal.selectMediumPizza', size: 'medium' },
      { type: 'drink', labelKey: 'deal.selectDrink1' },
      { type: 'drink', labelKey: 'deal.selectDrink2' },
      { type: 'starter', labelKey: 'deal.selectStarter' }
    ]
  },
  'Deal 4': {
    components: []
  },
  'Deal 5': {
    components: [
      { type: 'pasta', labelKey: 'deal.selectPasta' },
      { type: 'drink', labelKey: 'deal.selectDrink' },
      { type: 'starter', labelKey: 'deal.selectStarter' }
    ]
  }
};

// -- Reusable Selectable Tile Component --
const SelectableTile = ({ selected, onClick, title, priceText, checkboxMode = false }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col justify-center items-start p-4 rounded-md border text-left transition-all duration-120 ease-out focus:outline-none focus:ring-2 focus:ring-signal-red focus:ring-offset-1 ${
        selected
          ? 'border-signal-red bg-mist'
          : 'border-slate bg-paper hover:bg-mist'
      }`}
    >
      <div className="flex items-center gap-2">
        {checkboxMode && (
          <div className={`flex items-center justify-center w-4 h-4 rounded-sm border transition-colors ${selected ? 'bg-signal-red border-signal-red' : 'bg-paper border-slate'}`}>
            <Check className={`w-3 h-3 text-paper ${selected ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        )}
        <span className={`font-sans font-medium text-sm ${selected ? 'text-signal-red font-bold' : 'text-ink'}`}>
          {title}
        </span>
      </div>
      {priceText && (
        <span className="text-xs font-mono mt-1 text-slate">
          {priceText}
        </span>
      )}
      {!checkboxMode && selected && (
        <div className="absolute top-2 right-2 text-signal-red">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

// -- Live Pizza Diagram Signature Element --
const LivePizzaDiagram = ({ size, crust, toppings }) => {
  // Simple abstract visualization
  const sizeMap = { small: 0.8, medium: 0.9, large: 1 };
  const scale = sizeMap[size?.id] || 0.9;
  
  const crustBorder = crust?.id === 'deeppan' ? 'border-[12px]' : crust?.id === 'cheesy' ? 'border-8 border-yellow-500/30' : 'border-4';

  return (
    <div className="flex justify-center items-center py-4 bg-paper mb-4 border-b border-mist">
      <div 
        className={`rounded-full bg-mist border-slate/30 flex items-center justify-center relative transition-all duration-300 ${crustBorder}`}
        style={{ width: `${160 * scale}px`, height: `${160 * scale}px` }}
      >
        <span className="font-mono text-[10px] text-slate/50 absolute bottom-2 tracking-widest uppercase">{size?.name?.replace('size', '')}</span>
        {/* Abstract toppings dots */}
        {toppings && toppings.length > 0 && (
          <div className="absolute inset-4 opacity-40 flex flex-wrap justify-center items-center gap-1.5 overflow-hidden rounded-full">
            {toppings.slice(0, 15).map((t, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-signal-red/60" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ItemCustomizationModal = ({ item, allMenuItems = [], onClose, handleAddToCart }) => {
  const { t } = useTranslation();
  
  const initCrust = item.customizations?.crust || CRUST_OPTIONS[0];
  const initSize = item.customizations?.size || PIZZA_SIZES[0];
  const initToppings = item.customizations?.toppings || [];
  const initHalfHalf = item.customizations?.halfHalf || { left: [], right: [] };
  
  const initSubItems = {};
  if (item.customizations?.subItems) {
    item.customizations.subItems.forEach((sub) => {
       initSubItems[sub.componentIndex] = {
          item: sub,
          customizations: sub.customizations
       };
    });
  }

  const [selectedCrust, setSelectedCrust] = useState(initCrust);
  const [selectedSize, setSelectedSize] = useState(initSize);
  const [selectedToppings, setSelectedToppings] = useState(initToppings);

  const isHalfHalf = item.category === 'Half-Half Pizzas';
  const [activeHalf, setActiveHalf] = useState('left');
  const [halfHalfSelections, setHalfHalfSelections] = useState(initHalfHalf);

  const isDeal = item.category === 'Menu Deals';
  const dealConfig = DEAL_CONFIGS[item.name];
  const [selectedSubItems, setSelectedSubItems] = useState(initSubItems);
  
  // Guided deal flow: find first incomplete
  const getFirstIncompleteSection = () => {
    if (!isDeal || !dealConfig) return null;
    for (let i = 0; i < dealConfig.components.length; i++) {
      if (!selectedSubItems[i]) return i;
    }
    return dealConfig.components.length - 1; // Or all complete
  };
  
  const [openSection, setOpenSection] = useState(isDeal ? getFirstIncompleteSection() : null);

  const isPizza = item.category === 'Pizzas' || isHalfHalf;

  const totalPrice = useMemo(() => {
    let price = isPizza ? selectedSize.price : (item.price || 0);
    price += selectedCrust.price;
    
    if (isHalfHalf) {
      price += (halfHalfSelections.left.length + halfHalfSelections.right.length) * TOPPING_PRICE;
    } else {
      price += selectedToppings.length * TOPPING_PRICE;
    }

    if (isDeal) {
      Object.values(selectedSubItems).forEach(sub => {
        if (sub.customizations) {
          if (sub.customizations.crust) price += sub.customizations.crust.price || 0;
          if (sub.customizations.toppings) price += sub.customizations.toppings.length * TOPPING_PRICE;
        }
      });
    }

    return price;
  }, [item.price, isPizza, isHalfHalf, isDeal, selectedSize, selectedCrust, selectedToppings, halfHalfSelections, selectedSubItems]);

  const isComplete = useMemo(() => {
    if (!isDeal || !dealConfig || !dealConfig.components.length) return true;
    return dealConfig.components.every((_, idx) => selectedSubItems[idx]);
  }, [isDeal, dealConfig, selectedSubItems]);

  const toggleTopping = (topping) => {
    if (isHalfHalf) {
      setHalfHalfSelections(prev => {
        const current = prev[activeHalf];
        const next = current.includes(topping) ? current.filter(t => t !== topping) : [...current, topping];
        return { ...prev, [activeHalf]: next };
      });
    } else {
      setSelectedToppings((prev) =>
        prev.includes(topping)
          ? prev.filter((t) => t !== topping)
          : [...prev, topping]
      );
    }
  };

  const handleConfirm = () => {
    try {
      if (!isComplete) return;

      const customizedItem = {
        ...item,
        cartItemId: item.cartItemId || `${item.id}-${Date.now()}`,
        customizations: isDeal ? {
          subItems: Object.entries(selectedSubItems).map(([idx, data]) => ({
            ...data.item,
            customizations: data.customizations,
            componentIndex: idx
          }))
        } : isHalfHalf ? {
          size: selectedSize,
          crust: selectedCrust,
          halfHalf: halfHalfSelections
        } : {
          size: isPizza ? selectedSize : null,
          crust: selectedCrust,
          toppings: selectedToppings,
        },
        totalPrice: totalPrice,
      };
      
      handleAddToCart(customizedItem);
      
      // Fire Cart Pulse animation event
      window.dispatchEvent(new Event('cart:pulse'));
    } catch (err) {
      console.error('Failed to add customized item to cart:', err);
    } finally {
      // Small delay for the fade out effect could be handled in CSS/state, 
      // but simple close is usually fine if we have an unmount animation.
      onClose();
    }
  };

  const getCategoryItems = (type) => {
    const categoryMap = {
      'pizza': 'Pizzas',
      'drink': 'Drinks',
      'starter': 'Starters',
      'pasta': 'Pastas'
    };
    return allMenuItems.filter(i => i.category === categoryMap[type]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-paper w-full max-w-2xl max-h-[90vh] rounded-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-mist flex justify-between items-center bg-paper">
          <div>
            <h2 className="text-2xl font-bold font-display text-ink tracking-tight">{item.name}</h2>
            <p className="text-sm text-slate font-sans mt-1">Customize your {item.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-mist text-slate hover:text-ink transition-colors rounded-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar relative">
          
          {isPizza && !isDeal && !isHalfHalf && (
            <LivePizzaDiagram size={selectedSize} crust={selectedCrust} toppings={selectedToppings} />
          )}

          <div className="p-6 space-y-10">
            {/* Half-Half Interactive Diagram */}
            {isHalfHalf && (
              <section className="flex flex-col items-center">
                <div className="mb-6 text-center">
                  <h3 className="text-lg font-bold font-display text-ink uppercase tracking-wide">Build Your Half-Half</h3>
                  <p className="text-sm text-slate font-sans mt-1">Select a half, then add toppings below.</p>
                </div>

                {/* The Interactive Pizza Circle */}
                <div className="relative w-48 h-48 rounded-full border-4 border-mist overflow-hidden flex shadow-sm cursor-pointer mb-8">
                  <div 
                    className={`w-1/2 h-full flex flex-col justify-center items-center transition-colors ${activeHalf === 'left' ? 'bg-signal-red text-paper' : 'bg-paper text-slate hover:bg-mist'}`}
                    onClick={() => setActiveHalf('left')}
                  >
                    <span className="font-bold font-mono tracking-widest uppercase text-sm -rotate-90 origin-center translate-x-3">Left</span>
                  </div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-mist transform -translate-x-1/2"></div>
                  <div 
                    className={`w-1/2 h-full flex flex-col justify-center items-center transition-colors ${activeHalf === 'right' ? 'bg-signal-red text-paper' : 'bg-paper text-slate hover:bg-mist'}`}
                    onClick={() => setActiveHalf('right')}
                  >
                    <span className="font-bold font-mono tracking-widest uppercase text-sm rotate-90 origin-center -translate-x-3">Right</span>
                  </div>
                </div>
              </section>
            )}

            {/* Deal Customization Accordion */}
            {isDeal && dealConfig && dealConfig.components.length > 0 && (
              <div className="space-y-4">
                {dealConfig.components.map((comp, idx) => {
                  const isOpen = openSection === idx;
                  const selection = selectedSubItems[idx];
                  const items = getCategoryItems(comp.type);

                  // Fallback for translation keys if missing
                  const compLabel = t(comp.labelKey) !== comp.labelKey ? t(comp.labelKey) : comp.labelKey.split('.').pop();

                  if (!isOpen && selection) {
                    // Summary State
                    return (
                      <div key={idx} className="border border-mist rounded-md overflow-hidden bg-paper px-5 py-4 flex items-center justify-between">
                        <div className="font-sans text-sm">
                          <span className="text-slate">{compLabel}: </span>
                          <span className="text-ink font-bold">{selection.item.name}</span>
                        </div>
                        <button onClick={() => setOpenSection(idx)} className="text-sm font-bold text-signal-red hover:underline">
                          {t('modal.change', 'Change')}
                        </button>
                      </div>
                    );
                  }

                  // Open State
                  return (
                    <div key={idx} className="border border-mist rounded-md overflow-hidden bg-paper">
                      <div className="px-5 py-4 border-b border-mist flex justify-between items-center bg-mist/50">
                        <h3 className="text-sm font-bold font-sans text-ink">{compLabel} <span className="text-slate font-normal italic ml-2">(Required)</span></h3>
                      </div>
                      
                      <div className="p-5 space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {items.map(i => (
                            <SelectableTile
                              key={i.item_id}
                              title={i.name}
                              selected={selection?.item.item_id === i.item_id}
                              onClick={() => {
                                setSelectedSubItems(prev => ({
                                  ...prev,
                                  [idx]: { 
                                    item: i, 
                                    customizations: comp.type === 'pizza' ? { 
                                      size: { id: comp.size, name: `size${comp.size.charAt(0).toUpperCase() + comp.size.slice(1)}` },
                                      crust: CRUST_OPTIONS[0],
                                      toppings: []
                                    } : null 
                                  }
                                }));
                                // Move to next section
                                setOpenSection(idx + 1 < dealConfig.components.length ? idx + 1 : null);
                              }}
                            />
                          ))}
                        </div>

                        {comp.type === 'pizza' && selection && (
                          <div className="mt-6 pt-6 border-t border-mist space-y-6">
                            <div>
                              <h5 className="text-sm font-bold font-sans text-ink mb-3">{t('modal.crustSelection')}</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {CRUST_OPTIONS.map(c => (
                                  <SelectableTile
                                    key={c.id}
                                    title={c.name}
                                    priceText={c.price === 0 ? t('modal.free') : `+€${c.price.toFixed(2)}`}
                                    selected={selection.customizations?.crust?.id === c.id}
                                    onClick={() => setSelectedSubItems(prev => ({
                                      ...prev,
                                      [idx]: { ...prev[idx], customizations: { ...prev[idx].customizations, crust: c } }
                                    }))}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-bold font-sans text-ink mb-3">{t('modal.extraToppings', { price: '1.00' })}</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {EXTRA_TOPPINGS.flatMap(g => g.items).slice(0, 15).map(tName => {
                                  const isSelected = selection.customizations?.toppings?.includes(tName);
                                  return (
                                    <SelectableTile
                                      key={tName}
                                      title={tName}
                                      checkboxMode
                                      selected={isSelected}
                                      onClick={() => {
                                        const current = selection.customizations?.toppings || [];
                                        const next = current.includes(tName) ? current.filter(t => t !== tName) : [...current, tName];
                                        setSelectedSubItems(prev => ({
                                          ...prev,
                                          [idx]: { ...prev[idx], customizations: { ...prev[idx].customizations, toppings: next } }
                                        }));
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Size Selection */}
            {isPizza && !isDeal && (
              <section>
                <h3 className="text-sm font-bold font-sans text-ink mb-3">{t('modal.lblSizeSelection')} <span className="text-slate font-normal italic ml-2">(Required)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PIZZA_SIZES.map((size) => (
                    <SelectableTile
                      key={size.id}
                      title={t(`modal.${size.name}`)}
                      priceText={`€${size.price.toFixed(2)}`}
                      selected={selectedSize.id === size.id}
                      onClick={() => setSelectedSize(size)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Crust Selection */}
            {isPizza && !isDeal && (
              <section>
                <h3 className="text-sm font-bold font-sans text-ink mb-3">{t('modal.crustSelection')} <span className="text-slate font-normal italic ml-2">(Required)</span></h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CRUST_OPTIONS.map((crust) => (
                    <SelectableTile
                      key={crust.id}
                      title={crust.name}
                      priceText={crust.price === 0 ? t('modal.free') : `+€${crust.price.toFixed(2)}`}
                      selected={selectedCrust.id === crust.id}
                      onClick={() => setSelectedCrust(crust)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Extra Toppings */}
            {!isDeal && (
              <section>
                <h3 className="text-sm font-bold font-sans text-ink mb-4">
                  {isHalfHalf ? `Add Toppings to ${activeHalf.toUpperCase()} HALF (+€${TOPPING_PRICE.toFixed(2)})` : t('modal.extraToppings', { price: TOPPING_PRICE.toFixed(2) })}
                </h3>
              
                <div className="space-y-8">
                  {EXTRA_TOPPINGS.map((group) => (
                    <div key={group.group}>
                      <h4 className="text-xs font-bold font-mono text-slate uppercase mb-3 tracking-widest">{group.group}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {group.items.map((topping) => {
                          const isSelected = isHalfHalf 
                            ? halfHalfSelections[activeHalf].includes(topping) 
                            : selectedToppings.includes(topping);

                          return (
                            <SelectableTile
                              key={topping}
                              title={topping}
                              checkboxMode
                              selected={isSelected}
                              onClick={() => toggleTopping(topping)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer / Action */}
        <div className="p-6 border-t border-mist bg-paper shrink-0">
          {/* Smart Deal Match Element */}
          {isPizza && !isDeal && !isHalfHalf && selectedSize.id === 'large' && (
            <div className="mb-4 text-center">
               <p className="text-sm font-sans text-slate">
                 This matches <span className="font-bold text-ink">Deal 1</span> — save €4 by choosing the deal instead.
               </p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!isComplete}
            className={`w-full font-bold py-4 px-6 rounded-md transition-all duration-150 flex items-center justify-between outline-none ${
              isComplete 
                ? 'bg-signal-red hover:bg-[#b01e1e] text-paper focus:ring-2 focus:ring-signal-red focus:ring-offset-2 focus:ring-offset-paper' 
                : 'bg-mist text-slate cursor-not-allowed'
            }`}
          >
            <span className="font-sans text-lg">{t('modal.confirmBtn', 'Confirm & Add to Cart')}</span>
            <span className={`font-mono text-lg ${isComplete ? 'opacity-90' : ''}`}>
              €{totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCustomizationModal;
