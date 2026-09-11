import React, { useState, useEffect, useMemo } from 'react';
import { X, Minus, Plus, ShoppingBag, MapPin, Store, Phone, Loader2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import ItemCustomizationModal, { DEAL_CONFIGS } from './ItemCustomizationModal';
import Stepper, { Step } from './Stepper';

const isCustomizable = (item) => {
  if (item.category === 'Pizzas') return true;
  if (item.category === 'Menu Deals') {
    const config = DEAL_CONFIGS[item.name];
    return config && config.components && config.components.length > 0;
  }
  return false;
};

const SUGGESTION_CATEGORIES = [
  { id: 'Desserts', labelKey: 'catDesserts', fallback: 'Desserts' },
  { id: 'Sauces', labelKey: 'catSauces', fallback: 'Sauzen' },
  { id: 'Drinks', labelKey: 'catDrinks', fallback: 'Dranken' }
];

const CartWidget = ({ isOpen, setIsOpen, cart, updateQuantity, clearCart, user, handleAddToCart }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [orderMode, setOrderMode] = useState('delivery'); // 'delivery' or 'takeaway'
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  // Takeaway pickup timing state
  const [pickupTimingType, setPickupTimingType] = useState('asap'); // 'asap' or 'scheduled'
  const [selectedPickupTime, setSelectedPickupTime] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [editingCartItem, setEditingCartItem] = useState(null);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState('Desserts');
  
  const [activeStep, setActiveStep] = useState(1);

  // Compute available pickup slots in 15-min intervals during opening hours (11:00-23:00)
  const availablePickupSlots = useMemo(() => {
    const slots = [];
    try {
      const nowStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Brussels" });
      const now = new Date(nowStr);

      const earliest = new Date(now.getTime() + 20 * 60000); // 20 min preparation
      const remainder = earliest.getMinutes() % 15;
      if (remainder !== 0) {
        earliest.setMinutes(earliest.getMinutes() + (15 - remainder));
      }
      earliest.setSeconds(0, 0);

      const opening = new Date(now);
      opening.setHours(11, 0, 0, 0);

      const closing = new Date(now);
      closing.setHours(22, 45, 0, 0);

      let currentSlot = earliest < opening ? new Date(opening) : new Date(earliest);

      while (currentSlot <= closing) {
        const hh = String(currentSlot.getHours()).padStart(2, '0');
        const mm = String(currentSlot.getMinutes()).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
        currentSlot = new Date(currentSlot.getTime() + 15 * 60000);
      }
    } catch (e) {
      console.error("Error computing pickup slots:", e);
    }
    return slots;
  }, [isOpen, orderMode]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      if (!address) setAddress(user.address || '');
      if (!phone) setPhone(user.phone_number || '');
    }
  }, [user, isOpen]);

  // Fetch menu items for the edit modal
  useEffect(() => {
    if (isOpen && allMenuItems.length === 0) {
      api.get('/menu').then(res => {
        const mappedItems = res.data.map(item => ({
          ...item,
          id: item.item_id || item.id,
          price: parseFloat(item.price)
        }));
        setAllMenuItems(mappedItems);
      }).catch(console.error);
    }
  }, [isOpen, allMenuItems.length]);

  const activeSuggestions = allMenuItems.filter(item => item.category === activeSuggestionCategory);

  const subtotal = cart.reduce((sum, item) => sum + ((item.totalPrice || item.price) * item.quantity), 0);
  const deliveryFee = orderMode === 'delivery' ? 3.50 : 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (orderMode === 'delivery' && !address.trim()) {
      toast.error('Please provide a delivery address.');
      return;
    }
    if (orderMode === 'takeaway' && pickupTimingType === 'scheduled' && !selectedPickupTime) {
      toast.error(t('cart.choosePickupTime', 'Kies een geldig afhaaltijdstip.'));
      return;
    }
    if (!phone.trim()) {
      toast.error('Please provide a contact number.');
      return;
    }
    
    setIsLoading(true);
    try {
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        customizations: item.customizations
      }));

      const finalPickupTime = orderMode === 'takeaway'
        ? (pickupTimingType === 'asap' ? 'ASAP' : selectedPickupTime)
        : null;

      await api.post('/orders', {
        items,
        delivery_address: orderMode === 'delivery' ? address : null,
        delivery_type: orderMode,
        pickup_time: finalPickupTime
      });

      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        clearCart();
      }, 3000);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error(err.response.data.error || "The store is currently closed.");
      } else {
        toast.error(err.response?.data?.error || 'Failed to place order.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasMainItem = cart.some(item => !['Drinks', 'Sauces'].includes(item.category));

  const isFormValid = () => {
    if (orderMode === 'delivery' && !address.trim()) return false;
    if (orderMode === 'takeaway' && pickupTimingType === 'scheduled' && !selectedPickupTime) return false;
    if (!phone.trim()) return false;
    if (editingAddress || editingPhone) return false;
    if (!hasMainItem) return false;
    return true;
  };

  const handleEditItemAddToCart = (customizedItem) => {
    handleAddToCart(customizedItem);
    setEditingCartItem(null);
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className={`fixed inset-0 bg-ink/40 backdrop-blur-sm z-60 transition-opacity duration-200 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Slide-out Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-paper border-l border-mist z-70 shadow-2xl transform transition-transform duration-200 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate bg-paper shrink-0">
          <h2 className="text-2xl font-bold font-display text-ink flex items-center">
            <ShoppingBag className="w-6 h-6 mr-3 text-ink" />
            Your Order
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate hover:text-ink hover:bg-mist rounded-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-mist text-ink rounded-md flex items-center justify-center mb-4 border border-slate">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold font-display text-ink">Order Confirmed</h3>
              <p className="text-slate font-sans">Your order has been sent to the kitchen.</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <ShoppingBag className="w-12 h-12 text-slate mb-4" strokeWidth={1.5} />
              <p className="text-base text-slate font-sans font-medium mb-4">Your cart is empty.</p>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/menu');
                }}
                className="text-signal-red font-sans font-bold hover:underline"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <Stepper
              initialStep={1}
              onStepChange={(step) => setActiveStep(step)}
              onFinalStepCompleted={handlePlaceOrder}
              backButtonText="Back"
              nextButtonText={activeStep === 3 ? (isLoading ? 'Processing...' : 'Place Order') : 'Continue'}
              nextButtonProps={{
                disabled: (activeStep === 1 && !hasMainItem) || (activeStep === 2 && !isFormValid()) || isLoading
              }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              <Step>
                <div className="px-6 pb-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
                  
                  {/* Cart Items List */}
                  <div className="space-y-0">
                {cart.map((item, index) => (
                  <div key={item.cartSignature || item.id} className={`py-5 ${index !== 0 ? 'border-t border-slate/30' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-ink font-sans">{item.name}</h4>
                        
                        {item.category === 'Menu Deals' && item.description && (!item.customizations || !item.customizations.subItems) && (
                           <p className="text-sm text-slate mt-1 leading-snug">{item.description}</p>
                        )}
                        
                        {item.customizations && (
                          <div className="text-sm text-slate mt-1 space-y-0.5 ml-2 border-l-2 border-mist pl-2">
                            {item.customizations.size && (
                              <p>Size: {item.customizations.size.name.replace('size', '')}</p>
                            )}
                            {item.customizations.crust && (
                              <p>Crust: {item.customizations.crust.name}</p>
                            )}
                            {item.customizations.toppings && item.customizations.toppings.length > 0 && (
                              <p>+ {item.customizations.toppings.join(', ')}</p>
                            )}
                            
                            {/* Half-Half */}
                            {item.customizations.halfHalf && (
                              <>
                                {item.customizations.halfHalf.left.length > 0 && (
                                  <p>Left: {item.customizations.halfHalf.left.join(', ')}</p>
                                )}
                                {item.customizations.halfHalf.right.length > 0 && (
                                  <p>Right: {item.customizations.halfHalf.right.join(', ')}</p>
                                )}
                              </>
                            )}

                            {/* Deal Sub-items */}
                            {item.customizations.subItems && item.customizations.subItems.map((sub, idx) => (
                              <div key={idx} className="mt-1">
                                 <p className="font-medium text-slate">• {sub.name}</p>
                                 {sub.customizations?.crust && (
                                   <p className="pl-3 text-xs">- {sub.customizations.crust.name}</p>
                                 )}
                                 {sub.customizations?.toppings && sub.customizations.toppings.length > 0 && (
                                   <p className="pl-3 text-xs">- + {sub.customizations.toppings.join(', ')}</p>
                                 )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          {isCustomizable(item) && (
                            <button 
                              onClick={() => setEditingCartItem(item)}
                              className="text-xs font-sans font-bold text-slate hover:text-ink transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button 
                            onClick={() => updateQuantity(item.cartSignature || item.id, -999)}
                            className="text-xs font-sans font-bold text-slate hover:text-signal-red transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="text-ink font-mono font-medium block">
                          €{((item.totalPrice || item.price) * item.quantity).toFixed(2)}
                        </span>

                        <div className="flex items-center bg-paper border border-slate rounded-md overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.cartSignature || item.id, -1)}
                            className="px-2.5 py-1.5 text-ink hover:bg-mist transition-colors border-r border-slate"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-medium font-mono text-ink w-8 text-center text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartSignature || item.id, 1)}
                            className="px-2.5 py-1.5 text-ink hover:bg-mist transition-colors border-l border-slate"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-slate w-full"></div>

              {/* Order Completion Suggestions with Category Tabs */}
              {allMenuItems.length > 0 && (
                <div className="bg-mist/50 border border-slate rounded-lg p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-ink font-bold font-sans text-xs uppercase tracking-wider">
                        {t('cart.completeOrder', 'Maak je bestelling compleet')}
                      </h4>
                      <p className="text-[11px] text-slate mt-0.5">
                        {t('cart.suggestionsSubtitle', 'Kies desserts, sauzen of drankjes')}
                      </p>
                    </div>
                  </div>

                  {/* Category Pill Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-paper border border-slate rounded-lg">
                    {SUGGESTION_CATEGORIES.map(cat => {
                      const isActive = activeSuggestionCategory === cat.id;
                      const countInCart = cart
                        .filter(ci => ci.category === cat.id)
                        .reduce((sum, ci) => sum + (ci.quantity || 1), 0);

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveSuggestionCategory(cat.id)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all duration-150 ${
                            isActive
                              ? 'bg-ink text-paper font-bold shadow-sm'
                              : 'text-slate hover:text-ink hover:bg-mist font-medium'
                          }`}
                        >
                          <span className="truncate">{t(`menu.${cat.labelKey}`, cat.fallback)}</span>
                          {countInCart > 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                                isActive ? 'bg-paper text-ink' : 'bg-ink/10 text-ink'
                              }`}
                            >
                              {countInCart}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggested Items for the Active Category */}
                  <div className="flex gap-2.5 overflow-x-auto custom-scrollbar snap-x pb-1 pt-0.5">
                    {activeSuggestions.length > 0 ? (
                      activeSuggestions.map(item => {
                        const inCartItem = cart.find(ci => ci.id === item.id);
                        const inCartQty = inCartItem ? inCartItem.quantity : 0;

                        return (
                          <div 
                            key={item.id} 
                            className="snap-start shrink-0 w-28 bg-paper border border-slate rounded-lg overflow-hidden flex flex-col shadow-sm group transition-colors hover:border-ink/40"
                          >
                            <div className="relative w-full h-20 bg-mist overflow-hidden border-b border-slate">
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=200&auto=format&fit=crop'; }}
                              />
                              {inCartQty > 0 && (
                                <span className="absolute top-1 right-1 bg-ink text-paper text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                  x{inCartQty}
                                </span>
                              )}
                            </div>
                            <div className="p-2 flex flex-col flex-1 justify-between gap-1.5">
                              <span className="font-sans font-medium text-ink text-xs line-clamp-2 leading-tight min-h-7">
                                {item.name}
                              </span>
                              <div className="flex items-center justify-between pt-1 border-t border-slate/30">
                                <span className="font-mono font-bold text-ink text-xs">
                                  €{Number(item.price).toFixed(2)}
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (isCustomizable(item)) {
                                      setEditingCartItem(item);
                                    } else {
                                      handleAddToCart(item);
                                    }
                                  }}
                                  className="w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center hover:bg-slate active:scale-95 transition-all shadow-xs"
                                  aria-label={`Add ${item.name}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full py-4 text-center text-xs text-slate">
                        Geen items beschikbaar
                      </div>
                    )}
                  </div>
                </div>
              )}
                </div>
              </Step>
              
              <Step>
                <div className="px-6 pb-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
              {/* Fulfillment Method */}
              <div>
                <div className="flex p-1 bg-paper border border-slate rounded-md mb-2">
                  <button
                    onClick={() => setOrderMode('delivery')}
                    className={`flex-1 py-2 text-sm font-bold font-sans rounded-sm transition-colors duration-100 ${
                      orderMode === 'delivery' ? 'bg-ink text-paper' : 'text-slate hover:text-ink'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    onClick={() => setOrderMode('takeaway')}
                    className={`flex-1 py-2 text-sm font-bold font-sans rounded-sm transition-colors duration-100 ${
                      orderMode === 'takeaway' ? 'bg-ink text-paper' : 'text-slate hover:text-ink'
                    }`}
                  >
                    Takeaway
                  </button>
                </div>
                <p className="text-xs text-slate font-sans text-center">
                  {orderMode === 'delivery' 
                    ? t('cart.deliveryEstimateWithFee', { fee: deliveryFee.toFixed(2), defaultValue: `Geschatte levertijd: 45-60 min (tot 1 uur) • Bezorgkosten: €${deliveryFee.toFixed(2)}` }) 
                    : t('cart.pickupEstimate', 'Geschatte afhaaltijd: 15-20 min')}
                </p>
              </div>

              {/* Contact & Address Confirmation */}
              <div className="space-y-3">
                
                {/* Address Card */}
                {orderMode === 'delivery' ? (
                  <div className="bg-mist border border-slate rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center text-ink font-bold font-sans text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        Delivering to
                      </div>
                      {!editingAddress && (
                        <button onClick={() => setEditingAddress(true)} className="text-xs font-bold text-slate hover:text-ink underline">
                          Change
                        </button>
                      )}
                    </div>
                    {editingAddress ? (
                      <div className="mt-3 flex gap-2">
                        <input 
                          type="text" 
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)} 
                          placeholder="Enter delivery address"
                          className="flex-1 bg-paper border border-slate rounded-md px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-ink"
                          autoFocus
                        />
                        <button 
                          onClick={() => setEditingAddress(false)}
                          disabled={!address.trim()}
                          className="px-4 py-2 bg-ink text-paper rounded-md text-sm font-bold disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-sans text-ink">{address || <span className="text-signal-red">No address provided</span>}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Store Card */}
                    <div className="bg-mist border border-slate rounded-md p-4">
                      <div className="flex items-center text-ink font-bold font-sans text-sm mb-1">
                        <Store className="w-4 h-4 mr-2 text-signal-red" />
                        {t('cart.pickupStoreAddressLabel', 'Afhaallocatie')}
                      </div>
                      <p className="text-sm font-sans text-ink font-bold">Pizza Town</p>
                      <p className="text-xs font-sans text-slate mt-0.5">Stationsstraat 14, 1861 Meise</p>
                      <div className="mt-2 inline-flex items-center text-[11px] font-mono font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Open: 11:00 - 23:00
                      </div>
                    </div>

                    {/* Pickup Timing Card */}
                    <div className="bg-mist border border-slate rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-ink font-bold font-sans text-sm">
                          <Clock className="w-4 h-4 mr-2 text-ink" />
                          {t('cart.pickupTimeLabel', 'Afhaaltijd')}
                        </div>
                        <span className="text-xs font-mono font-bold text-signal-red">
                          {pickupTimingType === 'asap' ? t('cart.asap', 'Zo snel mogelijk') : (selectedPickupTime || '—')}
                        </span>
                      </div>

                      {/* As Soon As Possible vs Specific Time Toggle */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPickupTimingType('asap')}
                          className={`py-2 px-3 rounded-md text-xs font-sans font-bold text-center border transition-all ${
                            pickupTimingType === 'asap'
                              ? 'bg-ink text-paper border-ink shadow-xs'
                              : 'bg-paper text-slate border-slate hover:text-ink hover:border-ink/50'
                          }`}
                        >
                          {t('cart.asap', 'Zo snel mogelijk (~15-20 min)')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPickupTimingType('scheduled');
                            if (!selectedPickupTime && availablePickupSlots.length > 0) {
                              setSelectedPickupTime(availablePickupSlots[0]);
                            }
                          }}
                          className={`py-2 px-3 rounded-md text-xs font-sans font-bold text-center border transition-all ${
                            pickupTimingType === 'scheduled'
                              ? 'bg-ink text-paper border-ink shadow-xs'
                              : 'bg-paper text-slate border-slate hover:text-ink hover:border-ink/50'
                          }`}
                        >
                          {t('cart.choosePickupTime', 'Kies afhaaltijd')}
                        </button>
                      </div>

                      {/* Time slot picker */}
                      {pickupTimingType === 'scheduled' && (
                        <div className="pt-2 border-t border-slate/30 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate font-medium">
                              {t('cart.pickupReadyAt', 'Klaar voor afhaling om')}:
                            </span>
                            <span className="font-mono font-bold text-ink">
                              {selectedPickupTime ? `${selectedPickupTime} uur` : 'Kies een tijdstip'}
                            </span>
                          </div>

                          {availablePickupSlots.length > 0 ? (
                            <div className="max-h-36 overflow-y-auto custom-scrollbar grid grid-cols-4 gap-1.5 p-1 bg-paper border border-slate rounded-md">
                              {availablePickupSlots.map(slot => {
                                const isSelected = selectedPickupTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedPickupTime(slot)}
                                    className={`py-1.5 px-1 rounded text-xs font-mono font-bold transition-all text-center ${
                                      isSelected
                                        ? 'bg-signal-red text-white shadow-xs'
                                        : 'text-ink hover:bg-mist'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-signal-red font-sans">
                              Geen tijdsloten meer beschikbaar voor vandaag.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Card */}
                <div className="bg-mist border border-slate rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center text-ink font-bold font-sans text-sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact number
                    </div>
                    {!editingPhone && (
                      <button onClick={() => setEditingPhone(true)} className="text-xs font-bold text-slate hover:text-ink underline">
                        Change
                      </button>
                    )}
                  </div>
                  {editingPhone ? (
                    <div className="mt-3 flex gap-2">
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d+()\s-]/g, ''))} 
                        placeholder="Enter phone number"
                        className="flex-1 bg-paper border border-slate rounded-md px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:border-ink"
                        autoFocus
                      />
                      <button 
                        onClick={() => setEditingPhone(false)}
                        disabled={!phone.trim()}
                        className="px-4 py-2 bg-ink text-paper rounded-md text-sm font-bold disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-sans text-ink">{phone || <span className="text-signal-red">No phone provided</span>}</p>
                  )}
                </div>

              </div>
                </div>
              </Step>

              <Step>
                <div className="px-6 pb-6 space-y-6 h-full overflow-y-auto custom-scrollbar">
                  {/* Fulfillment Summary Card */}
                  <div className="bg-mist border border-slate rounded-md p-4 space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate font-sans flex items-center gap-1.5">
                        {orderMode === 'takeaway' ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-signal-red" />
                            Afhalen
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-signal-red" />
                            Bezorging
                          </>
                        )}
                      </span>
                      <span className="text-xs font-mono font-bold text-signal-red">
                        {orderMode === 'takeaway'
                          ? (pickupTimingType === 'asap' ? t('cart.asap', 'Zo snel mogelijk (~15-20 min)') : `Klaar om ${selectedPickupTime}`)
                          : t('cart.deliveryEstimateSummary', 'Geschatte levertijd: 45-60 min (tot 1 uur)')}
                      </span>
                    </div>
                    {orderMode === 'takeaway' ? (
                      <div className="pt-1 border-t border-slate/30">
                        <p className="text-sm font-sans font-bold text-ink">Pizza Town</p>
                        <p className="text-xs font-sans text-slate">Stationsstraat 14, 1861 Meise</p>
                      </div>
                    ) : (
                      <div className="pt-1 border-t border-slate/30">
                        <p className="text-sm font-sans font-bold text-ink">{address}</p>
                      </div>
                    )}
                    <p className="text-xs font-sans text-slate">Tel: {phone}</p>
                  </div>

                  {/* Order Summary */}
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between text-slate font-sans text-sm">
                      <span>{t('cart.subtotal', 'Subtotal')}</span>
                      <span className="font-mono text-ink">€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate font-sans text-sm">
                      <span>{t('cart.deliveryFee', 'Delivery Fee')}</span>
                      <span className="font-mono text-ink">{orderMode === 'delivery' ? `€${deliveryFee.toFixed(2)}` : '—'}</span>
                    </div>
                    <div className="h-px bg-slate w-full my-2"></div>
                    <div className="flex justify-between font-bold text-ink text-lg">
                      <span className="font-display">{t('cart.total', 'Total')}</span>
                      <span className="font-mono">€{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Customer Cancellation Notice */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 flex items-start gap-3 mt-4">
                    <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-ink font-sans">
                        {t('cart.cancellationNoticeTitle', 'Wil je je bestelling annuleren?')}
                      </p>
                      <p className="text-slate font-sans leading-relaxed">
                        {t('cart.cancellationNoticeDesc', 'Zodra je bestelling geplaatst is, kan deze alleen telefonisch geannuleerd worden door direct contact op te nemen met het restaurant:')}{' '}
                        <a href="tel:022697176" className="font-bold text-ink underline inline-flex items-center gap-1 hover:text-signal-red transition-colors">
                          02 269 71 76
                        </a>
                      </p>
                    </div>
                  </div>

                </div>
              </Step>
            </Stepper>
          )}
        </div>
      </div>

      {/* Render Edit Modal if editing */}
      {editingCartItem && (
        <ItemCustomizationModal
          item={editingCartItem}
          allMenuItems={allMenuItems}
          onClose={() => setEditingCartItem(null)}
          handleAddToCart={handleEditItemAddToCart}
        />
      )}
    </>
  );
};

export default CartWidget;
