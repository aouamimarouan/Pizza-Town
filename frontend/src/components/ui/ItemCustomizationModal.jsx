import React, { useState, useMemo } from 'react';
import { X, Check, MousePointer2, Info, Plus } from 'lucide-react';
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

const DEAL_CONFIGS = {
  'Deal 1': {
    components: [
      { type: 'pizza', label: 'Keuze pizza large', size: 'large' },
      { type: 'drink', label: 'Keuze drank 1' },
      { type: 'drink', label: 'Keuze drank 2' },
      { type: 'starter', label: 'Keuze voorgerecht' }
    ]
  },
  'Deal 2': {
    components: [
      { type: 'pizza', label: 'Keuze pizza small 1', size: 'small' },
      { type: 'pizza', label: 'Keuze pizza small 2', size: 'small' },
      { type: 'drink', label: 'Keuze drank 1' },
      { type: 'drink', label: 'Keuze drank 2' },
      { type: 'starter', label: 'Keuze voorgerecht' }
    ]
  },
  'Deal 3': {
    components: [
      { type: 'pizza', label: 'Keuze pizza medium', size: 'medium' },
      { type: 'drink', label: 'Keuze drank 1' },
      { type: 'drink', label: 'Keuze drank 2' },
      { type: 'starter', label: 'Keuze voorgerecht' }
    ]
  },
  'Deal 4': {
    components: [] // Fixed bundle as per user description
  },
  'Deal 5': {
    components: [
      { type: 'pasta', label: 'Keuze pasta' },
      { type: 'drink', label: 'Keuze drank' },
      { type: 'starter', label: 'Keuze voorgerecht' }
    ]
  }
};

const ItemCustomizationModal = ({ item, allMenuItems = [], onClose, handleAddToCart }) => {
  const { t } = useTranslation();
  
  // Basic states
  const [selectedCrust, setSelectedCrust] = useState(CRUST_OPTIONS[0]);
  const [selectedSize, setSelectedSize] = useState(PIZZA_SIZES[0]);
  const [selectedToppings, setSelectedToppings] = useState([]);

  // Deal-specific states
  const isDeal = item.category === 'Menu Deals';
  const dealConfig = DEAL_CONFIGS[item.name];
  const [selectedSubItems, setSelectedSubItems] = useState({}); // { [componentIndex]: { item, customizations } }
  const [openSection, setOpenSection] = useState(isDeal ? 0 : null);

  const isPizza = item.category === 'Pizzas' || item.category === 'Half-Half Pizzas';

  const totalPrice = useMemo(() => {
    let price = isPizza ? selectedSize.price : (item.price || 0);
    
    // Add basic customizations
    price += selectedCrust.price;
    price += selectedToppings.length * TOPPING_PRICE;

    // Add customizations from deal sub-items (e.g. cheesy crust in a deal pizza)
    if (isDeal) {
      Object.values(selectedSubItems).forEach(sub => {
        if (sub.customizations) {
          if (sub.customizations.crust) price += sub.customizations.crust.price || 0;
          if (sub.customizations.toppings) price += sub.customizations.toppings.length * TOPPING_PRICE;
        }
      });
    }

    return price;
  }, [item.price, isPizza, isDeal, selectedSize, selectedCrust, selectedToppings, selectedSubItems]);

  const isComplete = useMemo(() => {
    if (!isDeal || !dealConfig || !dealConfig.components.length) return true;
    return dealConfig.components.every((_, idx) => selectedSubItems[idx]);
  }, [isDeal, dealConfig, selectedSubItems]);

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  const handleConfirm = () => {
    try {
      if (!isComplete) return;

      const customizedItem = {
        ...item,
        cartItemId: `${item.id}-${Date.now()}`,
        customizations: isDeal ? {
          subItems: Object.entries(selectedSubItems).map(([idx, data]) => ({
            ...data.item,
            customizations: data.customizations,
            componentIndex: idx
          }))
        } : {
          size: isPizza ? selectedSize : null,
          crust: selectedCrust,
          toppings: selectedToppings,
        },
        totalPrice: totalPrice,
      };
      
      handleAddToCart(customizedItem);
    } catch (err) {
      console.error('Failed to add customized item to cart:', err);
    } finally {
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
        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Deal Customization Accordion */}
          {isDeal && dealConfig && dealConfig.components.length > 0 && (
            <div className="space-y-4">
              {dealConfig.components.map((comp, idx) => {
                const isOpen = openSection === idx;
                const selection = selectedSubItems[idx];
                const items = getCategoryItems(comp.type);

                return (
                  <div key={idx} className="border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenSection(isOpen ? null : idx)}
                      className={`w-full px-5 py-4 flex items-center justify-between text-left transition-colors ${
                        isOpen ? 'bg-stone-50 dark:bg-stone-800' : 'bg-white dark:bg-stone-900'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold text-stone-900 dark:text-white">{comp.label}:</span>
                        <div className="text-xs mt-0.5">
                          {selection ? (
                            <span className="text-emerald-500 font-medium">{selection.item.name}</span>
                          ) : (
                            <span className="text-stone-400">Sélectionnez un (obligatoire)</span>
                          )}
                        </div>
                      </div>
                      <Plus className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="p-5 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {items.map(i => (
                            <button
                              key={i.item_id}
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
                              }}
                              className={`text-xs p-3 rounded-xl border text-center transition-all ${
                                selection?.item.item_id === i.item_id
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 font-bold'
                                  : 'border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              {i.name}
                            </button>
                          ))}
                        </div>

                        {/* Pizza Customization inside Accordion */}
                        {comp.type === 'pizza' && selection && (
                          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-6">
                            {/* Crust */}
                            <div>
                              <h5 className="text-[10px] uppercase font-bold text-stone-400 mb-2 tracking-widest">{t('modal.crustSelection')}</h5>
                              <div className="grid grid-cols-3 gap-2">
                                {CRUST_OPTIONS.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => setSelectedSubItems(prev => ({
                                      ...prev,
                                      [idx]: { ...prev[idx], customizations: { ...prev[idx].customizations, crust: c } }
                                    }))}
                                    className={`text-[10px] p-2 rounded-lg border text-center transition-all ${
                                      selection.customizations?.crust?.id === c.id
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600'
                                        : 'border-stone-100 dark:border-stone-800'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Toppings (Simplified for Deal) */}
                            <div>
                              <h5 className="text-[10px] uppercase font-bold text-stone-400 mb-2 tracking-widest">{t('modal.extraToppings', { price: '1.00' })}</h5>
                              <div className="flex flex-wrap gap-2">
                                {EXTRA_TOPPINGS.flatMap(g => g.items).slice(0, 15).map(tName => (
                                  <button
                                    key={tName}
                                    onClick={() => {
                                      const current = selection.customizations?.toppings || [];
                                      const next = current.includes(tName) ? current.filter(t => t !== tName) : [...current, tName];
                                      setSelectedSubItems(prev => ({
                                        ...prev,
                                        [idx]: { ...prev[idx], customizations: { ...prev[idx].customizations, toppings: next } }
                                      }));
                                    }}
                                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                                      selection.customizations?.toppings?.includes(tName)
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700'
                                        : 'border-stone-100 dark:border-stone-800'
                                    }`}
                                  >
                                    {tName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isDeal && (!dealConfig || dealConfig.components.length === 0) && (
             <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-100 dark:border-stone-800">
                <p className="text-stone-500 dark:text-stone-400 text-center text-sm italic">{item.description}</p>
             </div>
          )}

          {/* Size Selection (Only for Individual Pizzas, NOT Deals) */}
          {isPizza && !isDeal && (
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
                    <span className="text-sm text-stone-500 dark:text-stone-500 mt-1">
                      €{size.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Crust Selection (Only for individual items, NOT Deals) */}
          {isPizza && !isDeal && (
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
          )}

          {/* Extra Toppings (Only for individual items, NOT Deals) */}
          {!isDeal && (
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
          )}
        </div>

        {/* Footer / Action */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50">
          <button
            onClick={handleConfirm}
            disabled={!isComplete}
            className={`w-full font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-between ${
              isComplete 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>{t('modal.confirmBtn')}</span>
            <span className={isComplete ? 'bg-red-700/50 px-3 py-1 rounded-lg' : ''}>
              €{totalPrice.toFixed(2)}
            </span>
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
