import React, { useState, useEffect } from 'react';
import { Package, Clock, ShoppingBag, Loader2, RefreshCw } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users/profile');
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cooking': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[60vh]">
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white font-heading flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-red-500" />
            My Orders
          </h2>
          <p className="text-stone-500 mt-1">Track your recent orders and history</p>
        </div>
        <button 
          onClick={fetchProfileAndOrders}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
          <p>Loading your culinary journey...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 dark:bg-[#111] rounded-3xl border border-stone-200 dark:border-stone-800">
          <Package className="w-16 h-16 text-stone-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">No orders yet</h3>
          <p className="text-stone-500">Looks like you haven't ordered any artisan pizzas yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white dark:bg-[#151515] border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              
              {/* Order Header */}
              <div className="bg-stone-50 dark:bg-[#1a1a1a] px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white">Order #{order.order_id.split('-')[0].toUpperCase()}</h3>
                    <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Total Amount</p>
                    <p className="font-bold text-stone-900 dark:text-white">${order.total_price.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-4">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Items Summary</p>
                <div className="space-y-3">
                  {order.orderItems.map((item) => (
                    <div key={item.order_item_id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-400 ring-1 ring-stone-200 dark:ring-stone-700">
                          {item.quantity}x
                        </span>
                        <span className="text-stone-800 dark:text-stone-200 font-medium">{item.menuItem.name}</span>
                      </div>
                      <span className="text-stone-600 dark:text-stone-400 font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
