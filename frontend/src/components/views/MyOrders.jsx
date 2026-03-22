import React, { useState, useEffect } from 'react';
import { Package, Clock, ShoppingBag, Loader2, RefreshCw, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import socket from '../../services/socket.js';
import toast from 'react-hot-toast';

// Professional currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const MyOrders = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, reservationsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/reservations/my-reservations')
      ]);
      setOrders(profileRes.data.orders);
      setReservations(reservationsRes.data);
    } catch (err) {
      console.error(err);
      toast.error(t('orders.toastError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleReservationUpdate = (updatedRes) => {
      setReservations(prev => prev.map(res => 
        res.res_id === updatedRes.res_id ? { ...res, status: updatedRes.status } : res
      ));
      
      if (updatedRes.status === 'confirmed') {
        toast.success(t('orders.toastConfirmed', { count: updatedRes.guests }), {
          icon: '🎉',
          duration: 5000,
          style: {
            borderRadius: '16px',
            background: '#1c1917',
            color: '#fff',
            border: '1px solid #292524',
          },
        });
      }
    };

    socket.on('reservation_confirmed', handleReservationUpdate);
    socket.on('reservation_status_updated', handleReservationUpdate);

    return () => {
      socket.off('reservation_confirmed', handleReservationUpdate);
      socket.off('reservation_status_updated', handleReservationUpdate);
    };
  }, []);

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'cooking': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700';
    }
  };

  const getResStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[60vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 dark:text-white font-heading flex items-center gap-4 tracking-tighter uppercase">
            <ShoppingBag className="w-10 h-10 text-red-600" />
            {t('orders.title')}
          </h2>
          <p className="text-stone-500 mt-1 font-medium">{t('orders.subtitle')}</p>
        </div>
        <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl items-center shadow-inner">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-tighter ${activeTab === 'orders' ? 'bg-white dark:bg-stone-800 text-red-600 shadow-lg' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
          >
            {t('orders.tabOrders')}
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`px-8 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-tighter ${activeTab === 'reservations' ? 'bg-white dark:bg-stone-800 text-red-600 shadow-lg' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
          >
            {t('orders.tabReservations')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-6" />
          <p className="font-bold uppercase tracking-widest text-xs">{t('orders.loading')}</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 dark:bg-[#0f0f0f] rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                <Package className="w-20 h-20 text-stone-300 dark:text-stone-800 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tighter">{t('orders.noOrdersTitle')}</h3>
                <p className="text-stone-500 max-w-xs mx-auto">{t('orders.noOrdersDesc')}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {orders.map((order) => (
                  <div key={order.order_id} className="bg-white dark:bg-[#151515] border border-stone-200 dark:border-stone-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    {/* Order Header */}
                    <div className="bg-stone-50 dark:bg-[#1a1a1a] px-8 py-5 border-b border-stone-100 dark:border-stone-800 flex flex-wrap justify-between items-center gap-6">
                      <div className="flex items-center gap-5">
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-2xl shadow-sm">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-tighter text-xl leading-none">{t('orders.orderNumber', { id: order.order_id.split('-')[0].toUpperCase() })}</h3>
                          <p className="text-sm text-stone-400 flex items-center gap-1.5 mt-2 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] text-stone-400 uppercase font-black tracking-[0.2em] mb-1">{t('orders.totalAmount')}</p>
                          <p className="font-black text-stone-900 dark:text-white text-2xl leading-none">{formatCurrency(order.total_price)}</p>
                        </div>
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border-2 shadow-sm ${getOrderStatusColor(order.status)}`}>
                          {t(`orders.status_${order.status}`)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="px-8 py-6">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-5 border-l-2 border-red-600 pl-3">{t('orders.composition')}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {order.orderitems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-black text-red-600 ring-2 ring-stone-200 dark:ring-stone-700 shadow-sm group-hover:scale-110 transition-transform">
                                {item.quantity}×
                              </span>
                              <span className="text-stone-800 dark:text-stone-200 font-bold group-hover:text-red-500 transition-colors">{item.menuitems.name}</span>
                            </div>
                            <div className="h-px flex-grow mx-4 bg-stone-100 dark:bg-stone-800 hidden lg:block"></div>
                            <span className="text-stone-500 font-bold text-sm leading-none">{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            reservations.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 dark:bg-[#0f0f0f] rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm">
                <Calendar className="w-20 h-20 text-stone-300 dark:text-stone-800 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tighter">{t('orders.noResTitle')}</h3>
                <p className="text-stone-500 max-w-xs mx-auto">{t('orders.noResDesc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reservations.map((res) => (
                  <div key={res.res_id} className="bg-white dark:bg-[#151515] border border-stone-200 dark:border-stone-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 transition-all group-hover:w-3"></div>
                    
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-red-600 mb-4 border border-stone-100 dark:border-stone-700">
                          <Calendar className="w-3.5 h-3.5" />
                          {t('orders.resDate')}
                        </div>
                        <h3 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter uppercase leading-none">
                        {new Date(res.res_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </h3>
                      </div>
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border-2 shadow-sm ${getResStatusColor(res.status)}`}>
                        {t(`orders.status_${res.status}`)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-[#0a0a0a] rounded-[1.5rem] border border-stone-100 dark:border-stone-800/50 group-hover:bg-white dark:group-hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 flex items-center justify-center text-red-600 shadow-md group-hover:rotate-12 transition-transform">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">{t('orders.resTime')}</p>
                          <p className="font-black text-stone-900 dark:text-white text-lg">
                            {new Date(res.res_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-[#0a0a0a] rounded-[1.5rem] border border-stone-100 dark:border-stone-800/50 group-hover:bg-white dark:group-hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 flex items-center justify-center text-amber-500 shadow-md group-hover:-rotate-12 transition-transform">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">{t('orders.resGuests')}</p>
                          <p className="font-black text-stone-900 dark:text-white text-lg">{t('orders.guestsCount', { count: res.guests })}</p>
                        </div>
                      </div>
                    </div>
                    
                    {res.status === 'confirmed' && (
                      <div className="mt-6 flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" />
                        {t('orders.tableReady')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
