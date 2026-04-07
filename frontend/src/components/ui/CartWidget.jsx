import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, CreditCard, MapPin, Store, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import socket from '../../services/socket.js';

const CartWidget = ({ isOpen, setIsOpen, cart, updateQuantity, clearCart, user }) => {
  const { t } = useTranslation();
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [orderMode, setOrderMode] = useState('delivery'); // 'delivery' or 'takeaway'
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Pre-fill address from user profile when entering checkout step
  React.useEffect(() => {
    if (checkoutStep && user?.address && !address) {
      setAddress(user.address);
    }
  }, [checkoutStep, user?.address]);


  const subtotal = cart.reduce((sum, item) => sum + ((item.totalPrice || item.price) * item.quantity), 0);
  const deliveryFee = orderMode === 'delivery' ? 3.50 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (orderMode === 'delivery' && !address.trim()) {
      toast.error(t('cart.toastAddress'));
      return;
    }
    
    setIsLoading(true);
    try {
      // Map frontend cart structure to backend expected structure
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        customizations: item.customizations // Send crust, toppings, etc.
      }));

      const res = await api.post('/orders', {
        items,
        delivery_address: orderMode === 'delivery' ? address : null,
        delivery_type: orderMode
      });

      // Redundant socket emit removed (backend already notifies admins via 'new_order')

      setIsSuccess(true);
      toast.success(t('cart.toastSuccess'));
      
      setTimeout(() => {
        setIsSuccess(false);
        setCheckoutStep(false);
        setIsOpen(false);
        clearCart();
      }, 3000);
    } catch (err) {
      console.error(err);
      // Specifically handle the 403 "Store Closed" error
      if (err.response?.status === 403) {
        toast.error(err.response.data.error || "Le magasin est fermé");
      } else {
        toast.error(err.response?.data?.error || t('cart.toastError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className={`fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Slide-out Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-[#151515] border-l border-stone-200 dark:border-stone-800 z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-2xl font-bold font-heading text-stone-900 dark:text-white flex items-center">
            <ShoppingBag className="w-6 h-6 mr-3 text-red-600 dark:text-red-500" />
            {t('cart.title')}
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white">{t('cart.confirmedTitle')}</h3>
              <p className="text-stone-500 dark:text-stone-400">{t('cart.confirmedDesc')}</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <ShoppingBag className="w-16 h-16 text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-lg text-stone-500 dark:text-stone-400 font-medium">{t('cart.emptyDesc')}</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-4 text-red-600 dark:text-red-400 font-semibold hover:underline"
              >
                {t('cart.browseMenu')}
              </button>
            </div>
          ) : !checkoutStep ? (
            // Cart Items List
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.cartItemId || item.id} className="flex flex-col sm:flex-row items-center sm:items-start justify-between bg-stone-50 dark:bg-stone-900/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-800/50 gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-stone-900 dark:text-white">{item.name}</h4>
                    {item.customizations && (
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 space-y-0.5">
                        <p>• {t('cart.crust', { crust: item.customizations.crust.name })}</p>
                        {item.customizations.toppings.length > 0 && (
                          <p>• + {item.customizations.toppings.join(', ')}</p>
                        )}
                      </div>
                    )}
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mt-1 block">€{(item.totalPrice || item.price).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                      className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-stone-900 dark:text-white w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId || item.id, 1)}
                      className="p-1.5 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Checkout Form Step
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4">{t('cart.orderDetails')}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setOrderMode('delivery')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      orderMode === 'delivery' 
                        ? 'border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400' 
                        : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <MapPin className="w-6 h-6 mb-2" />
                    <span className="font-medium">{t('cart.delivery')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMode('takeaway')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      orderMode === 'takeaway' 
                        ? 'border-red-600 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400' 
                        : 'border-stone-200 dark:border-stone-800 text-stone-500 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <Store className="w-6 h-6 mb-2" />
                    <span className="font-medium">{t('cart.takeaway')}</span>
                  </button>
                </div>

                {orderMode === 'delivery' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">{t('cart.deliveryAddress')}</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('cart.addressPlaceholder')}
                      className="w-full bg-stone-900 border border-stone-800 rounded-md p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                )}
                
                {orderMode === 'takeaway' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl flex items-start">
                    <Store className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                    <p className="text-sm">{t('cart.pickupInfo')}</p>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer / Total */}
        {!isSuccess && cart.length > 0 && (
          <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/20">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-stone-500 dark:text-stone-400">
                <span>{t('cart.subtotal')}</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              {orderMode === 'delivery' && (
                <div className="flex justify-between text-stone-500 dark:text-stone-400">
                  <span>{t('cart.deliveryFee')}</span>
                  <span>€{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-stone-900 dark:text-white pt-3 border-t border-stone-200 dark:border-stone-800">
                <span>{t('cart.total')}</span>
                <span className="text-red-600 dark:text-red-500">€{total.toFixed(2)}</span>
              </div>
            </div>

            {!checkoutStep ? (
              <button 
                onClick={() => setCheckoutStep(true)}
                className="w-full flex items-center justify-center px-6 py-4 rounded-xl bg-red-600 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-[#151515] outline-none text-lg"
              >
                {t('cart.proceedCheckout')}
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => setCheckoutStep(false)}
                  className="px-6 py-4 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('cart.btnBack')}
                </button>
                <button 
                  form="checkout-form"
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-6 py-4 rounded-xl bg-red-600 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-[#151515] outline-none text-lg disabled:bg-stone-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <><CreditCard className="w-5 h-5 mr-2" /> {t('cart.btnConfirm')}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CartWidget;
