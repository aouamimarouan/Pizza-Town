import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import socket from '../../services/socket.js';
import toast from 'react-hot-toast';
import { Check, Receipt, CalendarDays, Phone } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const formatDateMono = (isoString) => {
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AccountView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('orders');
  
  // Data state
  const [profile, setProfile] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for Detail View
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, reservationsRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/reservations/my-reservations')
      ]);
      setProfile(profileRes.data);
      setReservations(reservationsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleOrderUpdate = () => fetchData();
    socket.on('order_status_updated', handleOrderUpdate);
    socket.on('reservation_status_updated', handleOrderUpdate);

    return () => {
      socket.off('order_status_updated', handleOrderUpdate);
      socket.off('reservation_status_updated', handleOrderUpdate);
    };
  }, []);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return { label: 'Order Placed', color: 'bg-ink', text: 'text-ink' };
      case 'cooking': return { label: 'Preparing', color: 'bg-ink', text: 'text-ink' };
      case 'out_for_delivery': return { label: 'Out for Delivery', color: 'bg-ink', text: 'text-ink' };
      case 'delivered': return { label: 'Delivered', color: 'bg-slate', text: 'text-slate' };
      case 'ready_for_pickup': return { label: 'Ready for Pickup', color: 'bg-ink', text: 'text-ink' };
      case 'picked_up': return { label: 'Picked Up', color: 'bg-slate', text: 'text-slate' };
      case 'cancelled': return { label: 'Cancelled', color: 'bg-signal-red', text: 'text-signal-red' };
      default: return { label: status, color: 'bg-slate', text: 'text-slate' };
    }
  };

  if (isLoading || !profile) {
    return <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-slate">Loading...</div>;
  }

  const activeOrders = profile.orders.filter(o => ['pending', 'cooking', 'out_for_delivery', 'ready_for_pickup'].includes(o.status));
  const orderHistory = profile.orders;

  const renderActiveTracker = () => {
    if (activeOrders.length === 0) return null;
    const order = activeOrders[0]; // Show first active order
    const steps = ['pending', 'cooking', 'out_for_delivery', 'delivered'];
    const currentIdx = steps.indexOf(order.status);
    
    return (
      <div className="bg-mist border border-slate rounded-md p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-bold text-ink">Active Order</h3>
          <span className="font-mono text-ink font-medium">{formatDateMono(order.created_at)}</span>
        </div>
        
        <div className="relative flex items-center justify-between w-full">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-slate/30 z-0" />
          
          {steps.map((step, idx) => {
            const isCompleted = currentIdx >= idx;
            const isCurrent = currentIdx === idx;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2 bg-mist px-2">
                <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${isCompleted ? 'bg-ink' : 'bg-paper border border-slate'}`} />
                <span className={`text-sm ${isCurrent ? 'font-bold text-ink' : 'text-slate'}`}>
                  {step === 'pending' ? 'Placed' : step === 'out_for_delivery' ? 'Delivering' : step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate/30 flex items-center justify-between gap-3 text-xs text-slate">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t('cart.cancellationNoticeDesc', 'Zodra je bestelling geplaatst is, kan deze alleen telefonisch geannuleerd worden door direct contact op te nemen met het restaurant:')}</span>
          </div>
          <a href="tel:022697176" className="font-bold text-ink hover:text-signal-red underline shrink-0 font-mono">
            02 269 71 76
          </a>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    if (orderHistory.length === 0) {
      return (
        <div className="py-12 border border-slate rounded-md text-center">
          <p className="font-sans text-ink">You haven't placed an order yet.</p>
        </div>
      );
    }

    if (selectedOrder) return renderOrderDetail(selectedOrder);

    return (
      <div className="space-y-4">
        {orderHistory.map(order => {
          const display = getStatusDisplay(order.status);
          const itemCount = order.orderitems.reduce((acc, i) => acc + i.quantity, 0);
          const previewText = order.orderitems.slice(0, 2).map(i => `${i.menuitems.name} (×${i.quantity})`).join(', ') + (order.orderitems.length > 2 ? '...' : '');

          return (
            <div key={order.order_id} className="bg-paper border border-slate rounded-md p-5 hover:bg-mist transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-ink text-sm font-bold">#{order.order_id.split('-')[0].toUpperCase()}</span>
                  <span className="font-mono text-slate text-sm">{formatDateMono(order.created_at)}</span>
                </div>
                <p className="font-sans text-ink text-sm mb-3">{previewText}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${display.color}`} />
                  <span className={`text-sm font-sans font-medium ${display.text}`}>{display.label}</span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t border-slate sm:border-none pt-4 sm:pt-0 mt-2 sm:mt-0">
                <div className="text-left sm:text-right">
                  <div className="font-mono text-ink font-bold">{formatCurrency(order.total_price)}</div>
                  <div className="font-mono text-slate text-xs">{itemCount} items</div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="px-4 py-2 border border-slate rounded-md font-sans text-sm font-medium hover:bg-paper hover:text-ink text-slate transition-colors"
                >
                  View details
                </button>
              </div>

            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderDetail = (order) => {
    const display = getStatusDisplay(order.status);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button 
          onClick={() => setSelectedOrder(null)}
          className="text-sm font-sans font-medium text-slate hover:text-ink mb-6"
        >
          ← Back to Orders
        </button>

        <div className="border border-slate rounded-md p-6 bg-paper">
          <div className="border-b border-slate pb-6 mb-6">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
              <h2 className="font-display font-bold text-2xl text-ink">Order #{order.order_id.split('-')[0].toUpperCase()}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${display.color}`} />
                <span className={`text-sm font-sans font-bold ${display.text}`}>{display.label}</span>
              </div>
            </div>
            <p className="font-mono text-slate text-sm">{formatDateMono(order.created_at)}</p>
          </div>

          <div className="space-y-4 mb-8">
            {order.orderitems.map(item => (
              <div key={item.id} className="flex justify-between items-start font-sans">
                <div>
                  <div className="font-medium text-ink">
                    <span className="font-mono mr-2">{item.quantity}×</span> 
                    {item.menuitems.name}
                  </div>
                  {item.customizations && (
                    <div className="text-slate text-sm ml-6 mt-1 whitespace-pre-line">
                      {item.customizations}
                    </div>
                  )}
                </div>
                <div className="font-mono text-ink">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate pt-6 space-y-2 font-mono text-sm">
            <div className="flex justify-between text-slate">
              <span>Subtotal</span>
              <span>{formatCurrency(order.total_price)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink text-base pt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total_price)}</span>
            </div>
          </div>

          <div className="border-t border-slate mt-8 pt-6 font-sans text-sm text-slate">
            <p className="mb-1"><span className="text-ink font-medium">Delivery Address:</span> {order.delivery_address || profile.address}</p>
            <p><span className="text-ink font-medium">Payment:</span> Cash on Delivery</p>
          </div>
        </div>
      </div>
    );
  };

  const renderReservations = () => {
    if (reservations.length === 0) {
      return (
        <div className="py-12 border border-slate rounded-md text-center">
          <p className="font-sans text-ink">You have no upcoming reservations.</p>
        </div>
      );
    }

    const handleCancelReservation = async (id) => {
      try {
        await api.patch(`/reservations/${id}/cancel`);
        toast.success('Reservation cancelled.');
        setReservations(prev => prev.map(r => r.res_id === id ? { ...r, status: 'cancelled' } : r));
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to cancel reservation.');
      }
    };

    return (
      <div className="space-y-4">
        {reservations.map(res => {
          let statusText = 'Requested';
          let textColor = 'text-ink';
          let showCheck = false;

          if (res.status === 'confirmed') {
            statusText = 'Confirmed';
            showCheck = true;
          } else if (res.status === 'declined' || res.status === 'cancelled') {
            statusText = 'Declined';
            textColor = 'text-signal-red';
          }

          return (
            <div key={res.res_id} className="bg-paper border border-slate rounded-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-mono text-ink font-bold mb-2">
                  {new Date(res.res_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(res.res_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="font-sans text-slate text-sm">{res.guests} Guests</div>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  {showCheck && <Check className="w-4 h-4 text-ink" />}
                  <span className={`text-sm font-sans font-medium ${textColor}`}>
                    {statusText}
                  </span>
                </div>
                {(res.status === 'pending' || res.status === 'confirmed') && (
                  <button 
                    onClick={() => handleCancelReservation(res.res_id)}
                    className="text-xs font-medium font-sans text-slate underline hover:text-signal-red transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        <h1 className="font-display font-bold text-3xl text-ink tracking-tight mb-8">My Orders & Reservations</h1>

        {/* Navigation Tabs */}
        <div className="flex border-b border-mist mb-8 overflow-x-auto hide-scrollbar">
          {[
            { id: 'orders', label: 'Orders', icon: Receipt },
            { id: 'reservations', label: 'Reservations', icon: CalendarDays }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); }}
                className={`flex items-center gap-2 px-6 py-3 font-sans font-medium text-sm transition-colors relative
                  ${activeTab === tab.id ? 'text-ink' : 'text-slate hover:text-ink'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-signal-red" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="pb-24">
          {activeTab === 'orders' && (
            <>
              {!selectedOrder && renderActiveTracker()}
              {renderOrders()}
            </>
          )}
          {activeTab === 'reservations' && renderReservations()}
        </div>

      </div>
    </div>
  );
}
