import React, { useState, useEffect } from 'react';
import { 
 ShoppingBag, Pizza, Users, ConciergeBell, Activity, Search,
 CheckCircle, Receipt, MapPin, AlertCircle, Plus, Edit2, Trash2, X, Loader2,
  ChevronDown, ChevronUp, Printer, Clock, BarChart3, Calendar, BellRing,
  ArrowLeft, LogOut, Flag, Settings, Bike, Utensils, Mail, Star, Volume2, VolumeX
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import socket from '../../services/socket.js';
import { playOrderNotificationSound, isSoundAlertEnabled, setSoundAlertEnabled } from '../../utils/soundAlerts.js';

const AdminStatusBadge = ({ status }) => {
  const statusMap = {
    'pending': { color: 'text-signal-red', label: 'New' },
    'cancelled': { color: 'text-signal-red', label: 'Cancelled' },
    'confirmed': { color: 'text-[#4F6B45]', label: 'Confirmed' },
    'cooking': { color: 'text-[#B8860B]', label: 'Preparing' }, // Amber
    'ready_for_pickup': { color: 'text-[#B8860B]', label: 'Ready' },
    'out_for_delivery': { color: 'text-[#B8860B]', label: 'Out for Delivery' },
    'picked_up': { color: 'text-[#4F6B45]', label: 'Completed' }, // Basil
    'delivered': { color: 'text-[#4F6B45]', label: 'Delivered' },
  };

  const conf = statusMap[status] || { color: 'text-slate', label: status };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
      <span className={`w-2 h-2 rounded-full ${conf.color.replace('text-', 'bg-')}`}></span>
      {conf.label}
    </span>
  );
};

const CANCEL_PRESET_REASONS = [
  { id: 'ingredients', labelKey: 'cancelPreset1', fallback: 'Ingrediënten niet voorradig' },
  { id: 'delivery_area', labelKey: 'cancelPreset2', fallback: 'Buiten bezorggebied' },
  { id: 'kitchen_overloaded', labelKey: 'cancelPreset3', fallback: 'Keuken overbelast / Te druk' },
  { id: 'store_closed', labelKey: 'cancelPreset4', fallback: 'Winkel gesloten' },
  { id: 'customer_request', labelKey: 'cancelPreset5', fallback: 'Klant vroeg annulering aan' },
  { id: 'technical', labelKey: 'cancelPreset6', fallback: 'Technisch probleem' },
];

const AdminDashboard = () => {
 const { t } = useTranslation();
 const [activeAdminTab, setActiveAdminTab] = useState('orders');
 const [searchQuery, setSearchQuery] = useState('');
 const [reportRange, setReportRange] = useState('today');
 const [chartMetric, setChartMetric] = useState('sales');
 
 // --- Orders State ---
 const [orders, setOrders] = useState([]);
 const [isOrdersLoading, setIsOrdersLoading] = useState(true);
 const [expandedOrderId, setExpandedOrderId] = useState(null);

 // --- Order Cancellation State ---
 const [orderToCancel, setOrderToCancel] = useState(null);
 const [cancelReason, setCancelReason] = useState('');
 const [isCancelling, setIsCancelling] = useState(false);

 const handleOpenCancelModal = (order) => {
   setOrderToCancel(order);
   setCancelReason('');
 };

 const handleConfirmCancelOrder = async () => {
   if (!orderToCancel) return;
   setIsCancelling(true);
   try {
     await api.patch(`/orders/${orderToCancel.order_id}/status`, {
       status: 'cancelled',
       reason: cancelReason.trim() || 'Geen specifieke reden opgegeven'
     });
     toast.success(t('admin.toastOrderCancelled', 'Bestelling geannuleerd en e-mail verzonden naar klant.'));
     setOrderToCancel(null);
     setCancelReason('');
     fetchOrders();
   } catch (err) {
     console.error("Cancel order error:", err);
     toast.error(t('admin.toastCancelErr', 'Bestelling annuleren mislukt.'));
   } finally {
     setIsCancelling(false);
   }
 };

  // --- Order Deletion State ---
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // --- Bulk Deletion State ---
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [bulkTimeframe, setBulkTimeframe] = useState('24h');
  const [bulkOnlyCompleted, setBulkOnlyCompleted] = useState(true);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const matchingBulkOrders = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const now = Date.now();
    let cutoffTime = 0;
    if (bulkTimeframe === '24h') cutoffTime = now - 24 * 60 * 60 * 1000;
    else if (bulkTimeframe === '7d') cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
    else if (bulkTimeframe === '30d') cutoffTime = now - 30 * 24 * 60 * 60 * 1000;

    return orders.filter(o => {
      const orderTime = new Date(o.created_at).getTime();
      const matchesTime = cutoffTime === 0 || orderTime >= cutoffTime;
      if (!matchesTime) return false;
      if (bulkOnlyCompleted) {
        return ['delivered', 'picked_up', 'cancelled'].includes(o.status);
      }
      return true;
    });
  }, [orders, bulkTimeframe, bulkOnlyCompleted]);

  const handleConfirmDeleteSingle = async () => {
    if (!orderToDelete) return;
    setIsDeletingSingle(true);
    try {
      await api.delete(`/orders/${orderToDelete.order_id}`);
      toast.success(t('admin.toastOrderDeleted', 'Bestelling succesvol verwijderd.'));
      setOrders(prev => prev.filter(o => o.order_id !== orderToDelete.order_id));
      setOrderToDelete(null);
    } catch (err) {
      console.error('Delete order error:', err);
      toast.error(err.response?.data?.error || 'Bestelling verwijderen mislukt.');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleConfirmDeleteBulk = async () => {
    if (matchingBulkOrders.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const res = await api.delete('/orders/bulk/cleanup', {
        data: { timeframe: bulkTimeframe, onlyCompleted: bulkOnlyCompleted }
      });
      const count = res.data?.count ?? matchingBulkOrders.length;
      const deletedIds = res.data?.deleted_ids || matchingBulkOrders.map(o => o.order_id);
      setOrders(prev => prev.filter(o => !deletedIds.includes(o.order_id)));
      toast.success(t('admin.toastBulkDeleted', { count, defaultValue: `${count} bestelling(en) succesvol verwijderd.` }));
      setIsBulkDeleteOpen(false);
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error(err.response?.data?.error || 'Verwijderen mislukt.');
    } finally {
      setIsDeletingBulk(false);
    }
  };

 const fetchOrders = async () => {
 setIsOrdersLoading(true);
 try {
 const res = await api.get('/orders');
 setOrders(res.data);
 } catch (err) {
 toast.error(t('admin.toastLoadOrdersErr'));
 } finally {
 setIsOrdersLoading(false);
 }
 };

 useEffect(() => {
 if (activeAdminTab === 'orders' || activeAdminTab === 'reports') fetchOrders();
 }, [activeAdminTab]);

  const [soundEnabled, setSoundEnabled] = useState(isSoundAlertEnabled());

  const unacceptedOrders = React.useMemo(() => {
    return orders.filter(o => o.status === 'pending');
  }, [orders]);

  // Repeated sound alert every 25 seconds while there are pending orders waiting to be accepted
  useEffect(() => {
    let intervalId;
    if (unacceptedOrders.length > 0 && soundEnabled) {
      // Play immediately
      playOrderNotificationSound();

      // Repeat chime periodically until the order is accepted or muted
      intervalId = setInterval(() => {
        playOrderNotificationSound();
      }, 25000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [unacceptedOrders.length, soundEnabled]);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setSoundAlertEnabled(nextState);
    if (nextState) {
      playOrderNotificationSound(true); // Force play test chime
      toast.success('Meldingengeluid ingeschakeld (testbel afgespeeld)', { icon: '🔔' });
    } else {
      toast('Meldingengeluid gedempt', { icon: '🔕' });
    }
  };

 useEffect(() => {
   socket.emit('join_admin');

   socket.on('new_order', (newOrder) => {
     playOrderNotificationSound();
     setOrders((prev) => {
       const exists = prev.some(o => o.order_id === newOrder.order_id);
       if (exists) return prev;
       return [newOrder, ...prev];
     });
     
     toast.success(t('admin.toastNewOrder'), {
       duration: 6000,
       position: 'top-right',
       style: { background: '#059669', color: '#fff', fontWeight: 'bold', border: '1px solid #065f46' }
     });
   });

   socket.on('new_reservation', (newRes) => {
     playOrderNotificationSound();
     setReservations((prev) => {
       const exists = prev.some(r => r.res_id === newRes.res_id);
       if (exists) return prev;
       return [newRes, ...prev];
     });

     toast.success(t('admin.toastNewRes'), {
       duration: 8000,
       position: 'top-right',
       style: { background: '#8b5cf6', color: '#fff', fontWeight: 'bold', border: '1px solid #7c3aed' }
     });
   });

   socket.on('reservation_cancelled', (updatedRes) => {
     setReservations((prev) => prev.map(r => r.res_id === updatedRes.res_id ? updatedRes : r));
     toast('A reservation was cancelled by the customer.', {
       icon: '⚠️',
       duration: 6000,
       position: 'top-right',
       style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171' }
     });
   });

    socket.on('order_deleted', ({ order_id }) => {
      setOrders(prev => prev.filter(o => o.order_id !== order_id));
    });

    socket.on('orders_bulk_deleted', ({ deleted_ids }) => {
      if (Array.isArray(deleted_ids)) {
        setOrders(prev => prev.filter(o => !deleted_ids.includes(o.order_id)));
      }
    });

    return () => {
      socket.off('new_order');
      socket.off('new_reservation');
      socket.off('reservation_cancelled');
      socket.off('order_deleted');
      socket.off('orders_bulk_deleted');
    };
  }, []);

 const handleUpdateStatus = async (id, newStatus) => {
 try {
 await api.patch(`/orders/${id}/status`, { status: newStatus });
 toast.success(t('admin.toastStatusUpdate', { status: newStatus }));
 fetchOrders(); // Refresh the list
 } catch (err) {
 toast.error(t('admin.toastStatusUpdateErr'));
 }
 };

  const handleTestPrint = async () => {
    try {
      await api.post(`/orders/test-print`);
      toast.success('Test print sent to printer!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Test print failed. Is the printer offline?');
    }
  };

  const handleReprint = async (id) => {
    try {
      await api.post(`/orders/${id}/reprint`);
      toast.success('Reprint sent to printer!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reprint failed. Is the printer offline?');
    }
  };

 // --- Menu Management State ---
 const [menuItems, setMenuItems] = useState([]);
 const [isMenuLoading, setIsMenuLoading] = useState(true);

 const fetchMenuItems = async () => {
 setIsMenuLoading(true);
 try {
 const res = await api.get('/menu');
 setMenuItems(res.data);
 } catch (err) {
 toast.error(t('admin.toastLoadMenuErr'));
 } finally {
 setIsMenuLoading(false);
 }
 };

 useEffect(() => {
 if (activeAdminTab === 'menu') fetchMenuItems();
 }, [activeAdminTab]);

 // --- Users Management State ---
 const [users, setUsers] = useState([]);
 const [isUsersLoading, setIsUsersLoading] = useState(true);

 const fetchUsers = async () => {
 setIsUsersLoading(true);
 try {
 const res = await api.get('/users');
 setUsers(res.data);
 } catch (err) {
 toast.error(t('admin.toastLoadUsersErr'));
 } finally {
 setIsUsersLoading(false);
 }
 };

 useEffect(() => {
 if (activeAdminTab === 'users') fetchUsers();
 }, [activeAdminTab]);

 // --- Reservations State ---
 const [reservations, setReservations] = useState([]);
 const [isReservationsLoading, setIsReservationsLoading] = useState(true);

 const fetchReservations = async () => {
 setIsReservationsLoading(true);
 try {
 const res = await api.get('/reservations');
 setReservations(res.data);
 } catch (err) {
 toast.error(t('admin.toastLoadResErr'));
 } finally {
 setIsReservationsLoading(false);
 }
 };

 useEffect(() => {
 if (activeAdminTab === 'reservations') fetchReservations();
 }, [activeAdminTab]);
 
 const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
 const [editingItem, setEditingItem] = useState(null);
 const [menuForm, setMenuForm] = useState({ name: '', category: 'Pizzas', price: '', description: '' });
 const [isSaving, setIsSaving] = useState(false);

 // --- Audit Logs State ---
 const [auditLogs, setAuditLogs] = useState([]);
 const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(true);

 const fetchAuditLogs = async () => {
 setIsAuditLogsLoading(true);
 try {
 const res = await api.get('/audit-logs');
 setAuditLogs(res.data);
 } catch (err) {
 toast.error(t('admin.toastLoadAuditErr'));
 } finally {
 setIsAuditLogsLoading(false);
 }
 };

 useEffect(() => {
 if (activeAdminTab === 'audit') fetchAuditLogs();
 }, [activeAdminTab]);
 
 // --- Reviews State ---
 const [reviews, setReviews] = useState([]);
 const [isReviewsLoading, setIsReviewsLoading] = useState(true);

 const fetchReviews = async () => {
   setIsReviewsLoading(true);
   try {
     const res = await api.get('/reviews');
     setReviews(res.data);
   } catch (err) {
     toast.error('Error loading reviews');
   } finally {
     setIsReviewsLoading(false);
   }
 };

 useEffect(() => {
   if (activeAdminTab === 'reviews') fetchReviews();
 }, [activeAdminTab]);

 const categories = ['Menu Deals', 'Starters', 'Pizzas', 'Pastas', 'Salads', 'Desserts', 'Drinks', 'Sauces'];

 const openMenuModal = (item = null) => {
 if (item) {
 setEditingItem(item.item_id);
 setMenuForm({ name: item.name, category: item.category, price: item.price, description: item.description || '' });
 } else {
 setEditingItem(null);
 setMenuForm({ name: '', category: 'Pizzas', price: '', description: '' });
 }
 setIsMenuModalOpen(true);
 };

 const handleSaveMenuItem = async (e) => {
 e.preventDefault();
 setIsSaving(true);
 try {
 const payload = { ...menuForm, price: parseFloat(menuForm.price) };
 if (editingItem) {
 await api.put(`/menu/${editingItem}`, payload);
 toast.success(t('admin.toastMenuUpdated'));
 } else {
 await api.post('/menu', payload);
 toast.success(t('admin.toastMenuCreated'));
 }
 setIsMenuModalOpen(false);
 fetchMenuItems();
 } catch (err) {
 toast.error(t('admin.toastMenuSaveErr'));
 } finally {
 setIsSaving(false);
 }
 };

 const handleConfirmReservation = async (id) => {
 try {
 await api.patch(`/reservations/${id}/status`, { status: 'confirmed' });
 toast.success(t('admin.toastResConfirmed'));
 fetchReservations();
 } catch (err) {
 toast.error(t('admin.toastResConfirmErr'));
 }
 };

 const handleDeleteMenuItem = async (id) => {
 if(window.confirm(t('admin.confirmDelete'))) {
 try {
 await api.delete(`/menu/${id}`);
 toast.success(t('admin.toastItemDeleted'));
 fetchMenuItems();
 } catch (err) {
 toast.error(t('admin.toastItemDeleteErr'));
 }
 }
 };

  const tabs = [
  { id: 'reports', label: 'Dashboard', icon: BarChart3 },
  { id: 'orders', label: t('admin.tabOrders'), icon: ShoppingBag },
  { id: 'reservations', label: t('admin.tabRes'), icon: ConciergeBell },
  { id: 'users', label: t('admin.tabUsers'), icon: Users },
  { id: 'menu', label: t('admin.tabMenu'), icon: Pizza },
  { id: 'audit', label: t('admin.tabAudit'), icon: Settings },
  { id: 'reviews', label: 'Client Reviews', icon: Star },
 ];

 return (
 <div className="flex h-screen bg-paper transition-colors font-sans text-slate overflow-hidden">
 

  {/* SIDEBAR */}
  <div className="w-16 md:w-20 bg-mist border-r border-slate flex flex-col items-center py-6 gap-6 z-20 shrink-0">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeAdminTab === tab.id;
      return (
        <button
          key={tab.id}
          title={tab.label}
          onClick={() => { setActiveAdminTab(tab.id); setSearchQuery(''); }}
          className={`p-3 rounded-md transition-all duration-200 ${
            isActive ? 'bg-ink text-paper' : 'text-slate hover:text-ink'
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      )
    })}
  </div>

  {/* MAIN WORKSPACE */}
  <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
    
    {/* TOP BAR */}
    <header className="h-16 bg-paper border-b border-slate flex items-center justify-between px-6 z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={() => window.location.href = '/'} className="text-slate hover:text-ink"><ArrowLeft className="w-5 h-5"/></button>
        <h1 className="font-bold text-ink uppercase tracking-widest text-sm">Pizza Town</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer text-slate hover:text-ink" title="Notifications">
          <BellRing className="w-5 h-5" />
          {unacceptedOrders.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-signal-red rounded-full border-2 border-paper"></span>
          )}
        </div>
      </div>
    </header>

    {/* NEW ORDER BANNER */}
    {unacceptedOrders.length > 0 && activeAdminTab === 'orders' && (
      <div className="bg-mist border-b-2 border-signal-red shadow-sm z-50 w-full animate-in slide-in-from-top-2 duration-300">
        <div className="max-w-7xl mx-auto p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-signal-red font-bold uppercase tracking-widest text-sm">
              <BellRing className="w-5 h-5 animate-pulse" />
              {unacceptedOrders.length} New Order{unacceptedOrders.length > 1 ? 's' : ''} Need{unacceptedOrders.length === 1 ? 's' : ''} Action
            </div>
            <button
              onClick={handleToggleSound}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-paper border border-slate/40 text-slate hover:text-ink font-semibold transition-colors"
              title="Toggle sound alerts"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
              {soundEnabled ? 'Geluid Actief' : 'Geluid Gedempt'}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {unacceptedOrders.map(order => (
              <div key={order.order_id} className="bg-paper border border-signal-red/30 p-3 rounded-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-ink text-lg">#{order.order_id.split('-')[0]}</span>
                  <span className="font-bold text-ink">{order.users?.full_name || t('admin.guestUser')}</span>
                  <span className="bg-signal-red/10 text-signal-red text-xs px-2 py-1 rounded font-bold uppercase border border-signal-red/20 flex items-center gap-1">
                    {order.delivery_type}
                    {order.delivery_type === 'takeaway' ? (
                      <span className="font-mono text-ink font-bold">
                        • {order.pickup_time && order.pickup_time !== 'ASAP' ? order.pickup_time : 'ASAP'}
                      </span>
                    ) : (
                      <span className="font-mono text-ink font-bold">
                        • 45-60M
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate text-sm">{order.orderitems?.length || 0} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-ink text-lg mr-2">€{parseFloat(order.total_price).toFixed(2)}</span>
                  <button 
                    onClick={() => handleOpenCancelModal(order)}
                    className="border border-signal-red text-signal-red hover:bg-signal-red hover:text-white px-3.5 py-2 rounded-md font-bold uppercase text-xs transition-colors shadow-sm"
                  >
                    {t('admin.btnCancelOrder', 'Annuleren')}
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(order.order_id, 'cooking')}
                    className="bg-signal-red hover:bg-ink text-white px-5 py-2 rounded-md font-bold uppercase text-xs transition-colors shadow-sm"
                  >
                    Accept Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

  {/* MAIN CONTENT AREA */}
  <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full max-w-7xl mx-auto space-y-8">
 


 {/* DATA TABLE WRAPPER */}
 <div className="bg-paper border border-slate rounded-md overflow-hidden flex flex-col shadow-sm transition-colors">
 
 <div className="p-6 border-b border-slate flex flex-col sm:flex-row justify-between items-center gap-4 bg-paper/50 ">
 <h2 className="text-lg font-bold text-ink flex items-center gap-2">
 <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
 {t('admin.manageConsole')} <span className="text-slate font-normal capitalize">/ {tabs.find(t => t.id === activeAdminTab)?.label}</span>
 </h2>
 
 <div className="flex items-center gap-4 w-full sm:w-auto">
 <div className="relative w-full sm:w-64">
 <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
 <input 
 type="text" 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder={t('admin.searchPlaceholder')}
 className="w-full bg-paper border border-slate text-sm text-ink rounded-md pl-9 pr-4 py-2 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all font-mono placeholder-slate"
 />
 </div>
  {activeAdminTab === 'orders' && (
    <>
      <button 
        onClick={handleToggleSound}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap border ${
          soundEnabled 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
            : 'bg-mist text-slate border-slate hover:bg-ink hover:text-paper'
        }`}
        title={soundEnabled ? "Geluid is actief. Klik om te testen / dempen" : "Geluid is gedempt. Klik om in te schakelen"}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate" />}
        {soundEnabled ? 'Geluid: Aan' : 'Geluid: Uit'}
      </button>

      <button 
        onClick={handleTestPrint}
        className="flex items-center gap-2 bg-mist hover:bg-ink hover:text-paper text-ink px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap border border-slate"
      >
        <Printer className="w-4 h-4" /> Test Printer
      </button>

      <button 
        onClick={() => setIsBulkDeleteOpen(true)}
        className="flex items-center gap-2 bg-red-500/10 hover:bg-signal-red hover:text-white text-signal-red border border-red-500/30 px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
        title="Bestellingen opschonen per tijdsperiode"
      >
        <Trash2 className="w-4 h-4" /> {t('admin.btnBulkDelete', 'Opruimen')}
      </button>
    </>
  )}
 {activeAdminTab === 'menu' && (
 <button 
 onClick={() => openMenuModal()}
 className="flex items-center gap-2 bg-signal-red hover:bg-ink text-paper px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
 >
 <Plus className="w-4 h-4" /> {t('admin.btnAddItem')}
 </button>
 )}
 </div>
 </div>

 {/* --- TAB: ORDERS --- */}
 {activeAdminTab === 'orders' ? (
 isOrdersLoading ? (
 <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate" /></div>
 ) : (
 <div className="overflow-x-auto">
  <table className="w-full text-left border-collapse text-sm">
  <thead>
  <tr className="bg-paper text-slate border-b border-slate font-mono text-xs uppercase tracking-wider">
  <th className="p-3 w-8"></th>
  <th className="p-3 w-10">Type</th>
  <th className="p-3 font-semibold">Order</th>
  <th className="p-3 font-semibold">Contact</th>
  <th className="p-3 font-semibold">Placed</th>
  <th className="p-3 font-semibold">Items</th>
  <th className="p-3 font-semibold">Total</th>
  <th className="p-3 font-semibold">Status</th>
  <th className="p-3 font-semibold text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-stone-800/50">
  {orders
  .filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.order_id?.toLowerCase().includes(q) || 
           o.users?.full_name?.toLowerCase().includes(q) ||
           o.status?.toLowerCase().includes(q);
  })
  .map((order) => {
  const isExpanded = expandedOrderId === order.order_id;
  const isPending = order.status === 'pending';
  const isCancelled = order.status === 'cancelled';
  const isCooking = order.status === 'cooking';
  const isOut = order.status === 'out_for_delivery';
  const needsAttention = isPending || isCancelled;

  const getRelativeTime = (d) => {
    if (!d) return '';
    const diff = Math.floor((new Date() - new Date(d)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff/60)} hrs ago`;
    return 'yesterday';
  };
  
  return (
  <React.Fragment key={order.order_id}>
  {/* MAIN ROW */}
  <tr 
  onClick={() => setExpandedOrderId(isExpanded ? null : order.order_id)}
  className={`cursor-pointer transition-all duration-200 border-b border-slate ${
  isExpanded ? 'bg-mist ' : 'hover:bg-paper '
  }`}
  >
  <td className="p-3 text-center">
  {needsAttention && <Flag className="w-4 h-4 text-signal-red inline" />}
  </td>
  <td className="p-3 text-center text-slate">
    <div className="flex flex-col items-center gap-1">
      {order.delivery_type === 'takeaway' ? <ShoppingBag className="w-5 h-5"/> : order.delivery_type === 'delivery' ? <Bike className="w-5 h-5"/> : <Utensils className="w-5 h-5"/>}
      {order.delivery_type === 'takeaway' ? (
        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
          {order.pickup_time && order.pickup_time !== 'ASAP' ? order.pickup_time : 'ASAP'}
        </span>
      ) : order.delivery_type === 'delivery' ? (
        <span className="text-[10px] font-mono font-bold text-slate bg-mist px-1.5 py-0.5 rounded border border-slate whitespace-nowrap">
          45-60m
        </span>
      ) : null}
    </div>
  </td>
  <td className="p-3">
  <div className="flex items-center gap-2">
  {isExpanded ? <ChevronUp className="w-4 h-4 text-signal-red" /> : <ChevronDown className="w-4 h-4 text-slate" />}
  <div className="flex flex-col">
    <span className="font-bold text-ink truncate max-w-[150px]">{order.users?.full_name || t('admin.guestUser')}</span>
    <span className="font-mono text-slate text-[10px]">#{order.order_id?.split('-')[0]}</span>
  </div>
  </div>
  </td>
  <td className="p-3">
  <div className="flex flex-col">
    <span className="text-ink font-medium text-xs">{order.users?.phone_number || 'No Phone'}</span>
    <span className="text-slate text-[10px] truncate max-w-[120px]">{order.users?.email || 'No Email'}</span>
  </div>
  </td>
  <td className="p-3 text-slate text-xs italic">
    {getRelativeTime(order.created_at)}
  </td>
  <td className="p-3 text-ink text-xs font-medium">
    {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
  </td>
  <td className="p-3 font-mono font-bold text-ink">
    €{parseFloat(order.total_price || 0).toFixed(2)}
  </td>
  <td className="p-3">
  <AdminStatusBadge status={order.status} />
  </td>
  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
  <div className="flex justify-end gap-2">
  <button onClick={(e) => { e.stopPropagation(); handleReprint(order.order_id); }} className="p-1 px-3 bg-mist text-ink border border-slate rounded text-[10px] font-bold uppercase transition-colors hover:bg-black hover:text-paper flex items-center gap-1" title="Reprint Receipt">
    <Printer className="w-3 h-3" />
  </button>
  {isPending && (
  <button onClick={() => handleUpdateStatus(order.order_id, 'cooking')} className="p-1 px-3 bg-mist text-ink rounded text-[10px] font-bold uppercase transition-colors hover:bg-black hover:text-paper">
  {t('admin.btnAcceptCook')}
  </button>
  )}
  {isCooking && order.delivery_type === 'delivery' && (
  <button onClick={() => handleUpdateStatus(order.order_id, 'out_for_delivery')} className="p-1 px-3 bg-[#B8860B] text-white rounded text-[10px] font-bold uppercase hover:opacity-90 transition-opacity">
  {t('admin.btnSendOut')}
  </button>
  )}
  {isOut && (
  <button onClick={() => handleUpdateStatus(order.order_id, 'delivered')} className="p-1 px-3 bg-signal-red text-white rounded text-[10px] font-bold uppercase hover:opacity-90 transition-opacity">
  {t('admin.btnMarkDelivered')}
  </button>
  )}
  {isCooking && order.delivery_type === 'takeaway' && (
  <button onClick={() => handleUpdateStatus(order.order_id, 'ready_for_pickup')} className="p-1 px-3 bg-[#B8860B] text-white rounded text-[10px] font-bold uppercase hover:opacity-90 transition-opacity">
  {t('admin.btnReadyPickup')}
  </button>
  )}
  {order.status === 'ready_for_pickup' && (
  <button onClick={() => handleUpdateStatus(order.order_id, 'picked_up')} className="p-1 px-3 bg-signal-red text-white rounded text-[10px] font-bold uppercase hover:opacity-90 transition-opacity">
  {t('admin.btnMarkPickedUp')}
  </button>
  )}
  {order.status !== 'delivered' && order.status !== 'picked_up' && order.status !== 'cancelled' && (
  <button 
    onClick={(e) => { e.stopPropagation(); handleOpenCancelModal(order); }}
    className="p-1 px-2.5 bg-red-500/10 text-signal-red hover:bg-signal-red hover:text-white rounded text-[10px] font-bold uppercase transition-colors"
    title="Cancel Order"
  >
    {t('admin.btnCancelOrder', 'Annuleren')}
  </button>
  )}
  {(order.status === 'delivered' || order.status === 'picked_up') && (
  <CheckCircle className="w-5 h-5 text-signal-red" />
  )}
  <button 
    onClick={(e) => { e.stopPropagation(); setOrderToDelete(order); }}
    className="p-1 px-2.5 bg-red-500/10 text-signal-red hover:bg-signal-red hover:text-white rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
    title={t('admin.btnDeleteOrder', 'Verwijderen')}
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
  </div>
  </td>
  </tr>

 {/* EXPANDED TICKET VIEW */}
 {isExpanded && (
 <tr className="bg-paper animate-in fade-in slide-in-from-top-2 duration-300">
 <td colSpan="4" className="p-8">
 <div className="max-w-3xl border border-slate rounded-md bg-paper shadow-sm relative overflow-hidden">
 {/* Ticket Header */}
 <div className="bg-mist text-ink p-4 flex justify-between items-center">
 <div className="flex items-center gap-3">
 <Printer className="w-5 h-5 text-signal-red" />
 <h3 className="font-mono font-bold uppercase tracking-tighter text-lg">Order Ticket #{order.order_id?.split('-')[0]}</h3>
 </div>
 <div className="flex items-center gap-3 text-[11px] font-mono">
 <div className="flex items-center gap-1 text-slate"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString()}</div>
 <div className="bg-emerald-500/20 text-signal-red px-2 py-0.5 rounded uppercase font-bold">{order.delivery_type}</div>
 {order.delivery_type === 'takeaway' ? (
   <div className="bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded uppercase font-bold">
     Afhaaltijd: {order.pickup_time && order.pickup_time !== 'ASAP' ? order.pickup_time : 'Zo snel mogelijk'}
   </div>
 ) : (
   <div className="bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded uppercase font-bold">
     Levertijd: 45-60 min
   </div>
 )}
 </div>
 </div>

 {order.status === 'cancelled' && (
   <div className="bg-red-500/10 border-b border-signal-red/30 p-4 space-y-1">
     <span className="text-[10px] uppercase font-bold text-signal-red tracking-widest block">
       {t('admin.cancellationReasonHeading', 'Reden van annulering')}:
     </span>
     <p className="text-sm font-bold text-ink">
       {order.cancellation_reason || 'Geen specifieke reden geregistreerd'}
     </p>
   </div>
 )}

 {/* Ticket Body */}
 <div className="p-8 font-mono text-sm space-y-8 text-stone-700 ">
 <div>
 <h4 className="text-[10px] uppercase font-bold text-slate tracking-widest mb-4 border-b border-slate pb-2">Customer Details</h4>
 <div className="grid grid-cols-2 gap-8">
 <div>
 <p className="text-xs text-slate">Name</p>
 <p className="font-bold text-ink uppercase">{order.users?.full_name}</p>
 </div>
 <div>
 <p className="text-xs text-slate">Phone</p>
 <p className="font-bold text-ink ">{order.users?.phone_number || 'N/A'}</p>
 </div>
 </div>
 {order.delivery_type === 'delivery' ? (
 <div className="mt-4 space-y-2">
 <div>
 <p className="text-xs text-slate">Address</p>
 <p className="font-bold text-ink uppercase border-l-4 border-red-500 pl-3 py-1 bg-paper mt-1">
 {order.users?.address}
 </p>
 </div>
 <div>
 <p className="text-xs text-slate">Geschatte Levertijd</p>
 <p className="font-bold text-ink text-sm border-l-4 border-blue-500 pl-3 py-1 bg-paper mt-1">
 Ca. 45 - 60 minuten (tot 1 uur)
 </p>
 </div>
 </div>
 ) : (
 <div className="mt-4">
 <p className="text-xs text-slate">Afhaaltijd / Target Pickup Time</p>
 <p className="font-bold text-amber-700 dark:text-amber-400 text-sm uppercase border-l-4 border-amber-500 pl-3 py-1 bg-paper mt-1">
 {order.pickup_time && order.pickup_time !== 'ASAP' ? `Klaar om ${order.pickup_time}` : 'Zo snel mogelijk (~15-20 min)'}
 </p>
 </div>
 )}
 </div>

 <div>
 <h4 className="text-[10px] uppercase font-bold text-slate tracking-widest mb-4 border-b border-slate pb-2">Order Items</h4>
 <div className="space-y-6">
 {order.items?.map((item, iIdx) => {
 const cust = typeof item.customizations === 'string' ? JSON.parse(item.customizations) : item.customizations;
 return (
 <div key={iIdx} className="flex flex-col gap-2">
 <div className="flex items-baseline justify-between gap-4">
 <span className="font-black text-ink text-base">
 {item.quantity}x {item.menuitems?.name}
 </span>
 <span className="text-slate font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
 </div>
 
 {/* Item Customizations */}
 <div className="ml-6 space-y-1.5 border-l-2 border-slate pl-4">
 {/* Pizza Size & Crust */}
 {(cust?.size || cust?.crust) && (
 <div className="text-xs font-bold text-stone-800 ">
 {cust.size && <span className="uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded mr-2">{t(`modal.${cust.size.name}`) || cust.size.name}</span>}
 {cust.crust && <span className="uppercase text-slate">[{cust.crust.name}]</span>}
 </div>
 )}

 {/* Toppings / Extras */}
 {cust?.toppings?.map((t, tIdx) => (
 <div key={tIdx} className="text-[11px] text-emerald-600 font-bold flex items-center gap-2">
 <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
 + {t}
 </div>
 ))}

 {/* DEALS - Sub Items */}
 {cust?.subItems?.map((sub, sIdx) => (
 <div key={sIdx} className="py-2 first:pt-0">
 <div className="flex items-center gap-2 font-black text-ink text-xs uppercase">
 <Activity className="w-3 h-3" />
 {sub.quantity > 1 ? `${sub.quantity}x ` : ''}{sub.name}
 </div>
 {sub.customizations && (
 <div className="ml-5 pl-3 border-l border-stone-300 mt-1 space-y-1">
 {sub.customizations.size && <div className="text-[10px] font-bold text-slate uppercase">{t(`modal.${sub.customizations.size.name}`) || sub.customizations.size.name}</div>}
 {sub.customizations.crust && <div className="text-[10px] text-slate italic">[{sub.customizations.crust.name}]</div>}
 {sub.customizations.toppings?.map((st, stIdx) => (
 <div key={stIdx} className="text-[10px] text-emerald-600 font-bold">+ {st}</div>
 ))}
 </div>
 )}
 </div>
 ))}

 {cust?.extras?.map((e, eIdx) => (
 <div key={eIdx} className="text-[11px] text-emerald-600 font-bold flex items-center gap-2">
 <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
 + {e.name}
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="pt-6 border-t-2 border-dashed border-slate flex flex-col items-end">
 <div className="flex gap-12 font-black text-xl text-ink ">
 <span>TOTAL</span>
 <span>€{parseFloat(order.total_price).toFixed(2)}</span>
 </div>
 </div>
 </div>

  {/* Ticket Footer */}
  <div className="bg-paper p-4 border-t border-slate flex justify-between items-center text-xs">
    <span className="italic text-slate text-[10px] uppercase tracking-[0.2em]">*** End of Kitchen Ticket ***</span>
    <button 
      onClick={() => setOrderToDelete(order)}
      className="px-3 py-1.5 bg-red-500/10 hover:bg-signal-red hover:text-white text-signal-red rounded border border-red-500/20 text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5"
    >
      <Trash2 className="w-3.5 h-3.5" /> {t('admin.btnDeleteOrder', 'Bestelling Verwijderen')}
    </button>
  </div>
  </div>
  </td>
 </tr>
 )}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 )
 )

 /* --- TAB: DASHBOARD (formerly reports) --- */
 : activeAdminTab === 'reports' ? (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate">Viewing reports for:</span>
          <select 
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value)}
            className="bg-paper border border-slate rounded px-4 py-2 font-mono text-sm focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {(() => {
        const now = new Date();
        const filteredOrders = orders.filter(o => {
          if (!o.created_at) return false;
          
          const d = new Date(o.created_at);
          if (reportRange === 'today') {
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }
          if (reportRange === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return d >= startOfWeek;
          }
          if (reportRange === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }
          return true; // all
        });

        const nonCancelled = filteredOrders.filter(o => o.status !== 'cancelled');
        const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;
        
        const rev = nonCancelled.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
        const count = nonCancelled.length;
        const aov = count > 0 ? rev / count : 0;

        // Chart Data Calculation
        // Group by hour for 'today', otherwise group by day
        const chartMap = {};
        nonCancelled.forEach(o => {
           const d = new Date(o.created_at);
           const key = reportRange === 'today' 
             ? `${d.getHours().toString().padStart(2, '0')}:00`
             : `${d.getDate()}/${d.getMonth() + 1}`;
           
           if (!chartMap[key]) {
              chartMap[key] = { name: key, sales: 0, orders: 0 };
           }
           chartMap[key].sales += parseFloat(o.total_price || 0);
           chartMap[key].orders += 1;
        });
        
        // Sort keys
        const chartData = Object.values(chartMap).sort((a, b) => {
           if (reportRange === 'today') {
              return parseInt(a.name) - parseInt(b.name);
           }
           // simplistic sort for days
           const [d1, m1] = a.name.split('/').map(Number);
           const [d2, m2] = b.name.split('/').map(Number);
           return m1 === m2 ? d1 - d2 : m1 - m2;
        });

        return (
          <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-mist border border-slate p-6 rounded-md shadow-none flex justify-between items-center">
                  <h4 className="text-sm font-medium text-slate">Total Sales</h4>
                  <div className="text-2xl font-mono text-ink font-black">€{rev.toFixed(2)}</div>
               </div>
               <div className="bg-mist border border-slate p-6 rounded-md shadow-none flex justify-between items-center">
                  <h4 className="text-sm font-medium text-slate">Total Orders</h4>
                  <div className="text-2xl font-mono text-ink font-black">{count}</div>
               </div>
               <div className="bg-mist border border-slate p-6 rounded-md shadow-none flex justify-between items-center">
                  <h4 className="text-sm font-medium text-slate">Avg. Order Value</h4>
                  <div className="text-2xl font-mono text-ink font-black">€{aov.toFixed(2)}</div>
               </div>
               <div className="bg-mist border border-slate p-6 rounded-md shadow-none flex justify-between items-center">
                  <h4 className="text-sm font-medium text-slate">Cancelled Orders</h4>
                  <div className="text-2xl font-mono text-ink font-black">{cancelledCount}</div>
               </div>
            </div>

            {/* CHART */}
            <div className="bg-paper border border-slate rounded-md p-6">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-ink uppercase tracking-widest text-sm">Performance Chart</h3>
                  <div className="flex bg-mist border border-slate rounded p-1">
                     <button 
                       onClick={() => setChartMetric('sales')}
                       className={`px-4 py-1 text-xs font-bold uppercase rounded ${chartMetric === 'sales' ? 'bg-ink text-paper' : 'text-slate hover:bg-slate/10'}`}
                     >
                       Sales
                     </button>
                     <button 
                       onClick={() => setChartMetric('orders')}
                       className={`px-4 py-1 text-xs font-bold uppercase rounded ${chartMetric === 'orders' ? 'bg-ink text-paper' : 'text-slate hover:bg-slate/10'}`}
                     >
                       Orders
                     </button>
                  </div>
               </div>
               <div className="h-72 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                     <XAxis 
                       dataKey="name" 
                       tick={{fill: '#64748b', fontSize: 12, fontFamily: 'monospace'}} 
                       axisLine={false} 
                       tickLine={false}
                       dy={10}
                     />
                     <YAxis 
                       tick={{fill: '#64748b', fontSize: 12, fontFamily: 'monospace'}}
                       axisLine={false}
                       tickLine={false}
                       allowDecimals={false}
                       tickFormatter={(val) => chartMetric === 'sales' ? `€${val}` : val}
                     />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#FAF9F7', borderColor: '#6B6862', borderRadius: '6px', fontFamily: 'monospace' }}
                       itemStyle={{ color: '#14120F', fontWeight: 'bold' }}
                       formatter={(val) => [chartMetric === 'sales' ? `€${val.toFixed(2)}` : val, chartMetric === 'sales' ? 'Sales' : 'Orders']}
                     />
                     <Line 
                       type="monotone" 
                       dataKey={chartMetric} 
                       stroke="#D62828" 
                       strokeWidth={2}
                       dot={{ r: 4, strokeWidth: 2, fill: '#FAF9F7' }}
                       activeDot={{ r: 6, fill: '#D62828' }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        );
      })()}
    </div>
 ) : activeAdminTab === 'menu' ? (
 isMenuLoading ? (
 <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-paper text-slate border-b border-slate font-mono text-xs uppercase tracking-wider">
 <th className="p-4 font-semibold">{t('admin.colItemName')}</th>
 <th className="p-4 font-semibold">{t('admin.colCategory')}</th>
 <th className="p-4 font-semibold">{t('admin.colPrice')}</th>
 <th className="p-4 font-semibold text-right">{t('admin.colActions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-stone-800/50">
 {menuItems
 .filter(item => {
   if (!searchQuery) return true;
   const q = searchQuery.toLowerCase();
   return item.name?.toLowerCase().includes(q) || 
          item.category?.toLowerCase().includes(q);
 })
 .map((item) => (
 <tr key={item.item_id} className="hover:bg-mist transition-colors group">
 <td className="p-4 text-slate">
 <div className="font-medium text-slate">{item.name}</div>
 <div className="text-xs text-slate mt-1 max-w-[250px] truncate">{item.description}</div>
 </td>
 <td className="p-4">
 <span className="px-2 py-1 bg-stone-800 text-slate rounded text-xs border border-slate">
 {item.category}
 </span>
 </td>
 <td className="p-4 font-mono font-medium text-signal-red">€{parseFloat(item.price).toFixed(2)}</td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2">
 <button onClick={() => openMenuModal(item)} className="p-1.5 bg-mist text-slate hover:text-ink border-slate rounded border border-slate hover:bg-stone-700 transition-colors">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDeleteMenuItem(item.item_id)} className="p-1.5 bg-red-900/30 text-red-500 hover:text-red-400 rounded border border-red-900/50 hover:bg-red-900/50 transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )

 /* --- TAB: USERS --- */
 ) : activeAdminTab === 'users' ? (
 isUsersLoading ? (
 <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-paper text-slate border-b border-slate font-mono text-xs uppercase tracking-wider">
 <th className="p-4 font-semibold">{t('admin.colUser')}</th>
 <th className="p-4 font-semibold">{t('admin.colContact')}</th>
 <th className="p-4 font-semibold">{t('admin.colRole')}</th>
 <th className="p-4 font-semibold text-right">{t('admin.colOrders')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-stone-800/50">
 {users
 .filter(user => {
   if (!searchQuery) return true;
   const q = searchQuery.toLowerCase();
   return user.full_name?.toLowerCase().includes(q) || 
          user.email?.toLowerCase().includes(q) ||
          user.role?.toLowerCase().includes(q);
 })
 .map((user) => (
 <tr key={user.user_id} className="hover:bg-mist transition-colors group">
 <td className="p-4 text-slate">
 <div className="font-medium text-slate flex items-center gap-2">
 <Users className="w-4 h-4 text-slate" />
 {user.full_name}
 </div>
 <div className="text-xs text-slate mt-1">{t('admin.joinedAt', { date: new Date(user.created_at).toLocaleDateString() })}</div>
 </td>
 <td className="p-4 text-slate text-xs space-y-1">
 <div>{user.email}</div>
 {user.phone_number && <div>{user.phone_number}</div>}
 {user.address && <div className="truncate max-w-[200px] text-slate">{user.address}</div>}
 </td>
 <td className="p-4">
 <span className={`px-2 py-1 rounded text-xs border uppercase tracking-wider font-bold ${
 user.role === 'admin' 
 ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' 
 : 'bg-stone-800 text-slate border-slate'
 }`}>
 {user.role}
 </span>
 </td>
 <td className="p-4 font-mono font-medium text-right text-slate">
 {user._count?.orders || 0}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )

 /* --- TAB: RESERVATIONS --- */
 ) : activeAdminTab === 'reservations' ? (
 isReservationsLoading ? (
 <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-paper text-slate border-b border-slate font-mono text-xs uppercase tracking-wider">
 <th className="p-4 font-semibold">{t('admin.colGuest')}</th>
 <th className="p-4 font-semibold">{t('admin.colDateTime')}</th>
 <th className="p-4 font-semibold text-center">{t('admin.colGuestsCount')}</th>
 <th className="p-4 font-semibold">{t('admin.colStatus')}</th>
 <th className="p-4 font-semibold text-right">{t('admin.colActions')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-stone-800/50">
 {reservations
 .filter(res => {
   if (!searchQuery) return true;
   const q = searchQuery.toLowerCase();
   return res.full_name?.toLowerCase().includes(q) || 
          res.phone_number?.toLowerCase().includes(q) ||
          res.status?.toLowerCase().includes(q);
 })
 .map((res) => {
 const isPending = res.status === 'pending';
 const isCancelled = res.status === 'cancelled';
 const needsAttention = isPending || isCancelled;
 return (
 <tr key={res.res_id} className="hover:bg-mist transition-colors group">
 <td className="p-3 text-center">
 {needsAttention && <Flag className="w-4 h-4 text-signal-red inline" />}
 </td>
 <td className="p-3 text-slate">
 <div className="font-medium text-ink">{res.full_name}</div>
 <div className="text-xs text-slate mt-1">{res.phone_number}</div>
 </td>
 <td className="p-3 text-slate">
 <div>{new Date(res.res_date).toLocaleDateString()}</div>
 <div className="text-xs text-slate mt-1 font-mono">{new Date(res.res_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
 </td>
 <td className="p-3 text-center text-ink font-mono font-bold">
 {res.guests}
 </td>
 <td className="p-3">
 <AdminStatusBadge status={res.status} />
 </td>
 <td className="p-3 text-right">
 {isPending && (
 <button 
 onClick={() => handleConfirmReservation(res.res_id)}
 className="p-1 px-3 bg-[#4F6B45] text-white rounded text-[10px] font-bold uppercase hover:opacity-90 transition-opacity"
 >
 {t('admin.btnConfirm')}
 </button>
 )}
 </td>
 </tr>
 )})}
 </tbody>
 </table>
 </div>
 )

 /* --- TAB: AUDIT LOGS --- */
 ) : activeAdminTab === 'audit' ? (
 isAuditLogsLoading ? (
 <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-paper text-slate border-b border-slate font-mono text-xs uppercase tracking-wider">
 <th className="p-4 font-semibold">{t('admin.colTimestamp')}</th>
 <th className="p-4 font-semibold">{t('admin.colAdmin')}</th>
 <th className="p-4 font-semibold">{t('admin.colAction')}</th>
 <th className="p-4 font-semibold">{t('admin.colEntity')}</th>
 <th className="p-4 font-semibold">{t('admin.colDetails')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-stone-800/50">
 {auditLogs.length === 0 ? (
 <tr>
 <td colSpan="5" className="p-12 text-center text-slate font-medium">{t('admin.noAuditLogs')}</td>
 </tr>
 ) : (
 auditLogs
 .filter(log => {
   if (!searchQuery) return true;
   const q = searchQuery.toLowerCase();
   return log.admin?.full_name?.toLowerCase().includes(q) || 
          log.action?.toLowerCase().includes(q) ||
          log.entity_type?.toLowerCase().includes(q) ||
          log.entity_id?.toLowerCase().includes(q);
 })
 .map((log) => {
 const isDelete = log.action === 'DELETE';
 const isCreate = log.action === 'CREATE';
 const isUpdate = log.action === 'UPDATE';
 
 return (
 <tr key={log.id} className="hover:bg-mist transition-colors">
 <td className="p-4 text-slate font-mono text-[11px]">
 {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
 </td>
 <td className="p-4">
 <div className="text-slate font-medium">{log.admin?.full_name || t('admin.systemAdmin')}</div>
 <div className="text-[10px] text-slate font-mono uppercase">{log.admin?.email || t('admin.automatedAdmin')}</div>
 </td>
 <td className="p-4">
 <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
 isDelete ? 'bg-red-950/20 text-red-500 border-red-900/50' :
 isCreate ? 'bg-emerald-950/20 text-signal-red border-emerald-900/50' :
 'bg-blue-950/20 text-blue-500 border-blue-900/50'
 }`}>
 {log.action}
 </span>
 </td>
 <td className="p-4">
 <div className="text-slate font-medium">{log.entity_type}</div>
 <div className="text-[10px] text-slate font-mono truncate max-w-[100px]">{log.entity_id}</div>
 </td>
 <td className="p-4">
 <div className="text-slate text-xs italic line-clamp-2 max-w-[200px]">
 {log.details && typeof log.details === 'object' 
 ? JSON.stringify(log.details).substring(0, 100) + '...'
 : t('admin.noExtraData')
 }
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 )
 
 /* --- TAB: REVIEWS --- */
 ) : activeAdminTab === 'reviews' ? (
    isReviewsLoading ? (
      <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate" /></div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate">
            No client reviews received yet.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.review_id} className="bg-paper p-6 rounded-xl shadow-sm border border-mist flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-ink">{review.users?.full_name || 'Guest'}</h3>
                  <p className="text-sm text-slate">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= review.rating ? 'fill-[var(--cheese)] text-[var(--cheese)]' : 'fill-transparent text-[var(--mist)]'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-ink flex-grow bg-mist/30 p-4 rounded-lg italic">
                {review.comment ? `"${review.comment}"` : <span className="text-slate not-italic">No comment provided.</span>}
              </p>
              <div className="mt-4 pt-4 border-t border-mist flex justify-between items-center text-sm">
                <span className="text-slate font-mono">Order #{review.order_id.split('-')[0]}</span>
                {review.orders?.total_price && (
                  <span className="font-bold text-ink">{parseFloat(review.orders.total_price).toFixed(2)} EUR</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    )
  ) : (
 <div className="p-12 text-center flex flex-col items-center justify-center h-64 border-t border-slate">
 <Activity className="w-12 h-12 text-stone-800 mb-4" />
 <h3 className="text-lg font-medium text-slate">{t('admin.constrTitle')}</h3>
 <p className="text-slate text-sm mt-2 max-w-sm">{t('admin.constrDesc', { module: activeAdminTab })}</p>
 </div>
 )}
 
 </div>
 </main>

 {/* --- MENU ITEM MODAL --- */}
 {isMenuModalOpen && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-paper border border-slate rounded-md w-full max-w-md shadow-sm overflow-hidden">
 <div className="p-5 border-b border-slate flex justify-between items-center bg-paper">
 <h3 className="text-lg font-bold text-ink">
 {editingItem ? t('admin.editMenuItem') : t('admin.addMenuItem')}
 </h3>
 <button onClick={() => setIsMenuModalOpen(false)} className="text-slate hover:text-ink transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">{t('admin.lblItemName')}</label>
 <input 
 type="text" 
 required
 value={menuForm.name}
 onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
 className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
 placeholder={t('admin.plhItemName')}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">{t('admin.lblCategory')}</label>
 <select 
 value={menuForm.category}
 onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
 className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
 >
 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">{t('admin.lblPrice')}</label>
 <input 
 type="number" 
 step="0.01"
 required
 value={menuForm.price}
 onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
 className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
 placeholder={t('admin.plhPrice')}
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">{t('admin.lblDesc')}</label>
 <textarea 
 rows="3"
 value={menuForm.description}
 onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
 className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
 placeholder={t('admin.plhDesc')}
 ></textarea>
 </div>

 <div className="pt-4 flex justify-end gap-3">
 <button 
 type="button" 
 onClick={() => setIsMenuModalOpen(false)}
 className="px-4 py-2 rounded-md font-semibold text-slate hover:text-ink transition-colors"
 >
 {t('admin.btnCancel')}
 </button>
 <button 
 type="submit"
 disabled={isSaving}
 className="flex items-center gap-2 px-6 py-2 bg-signal-red hover:bg-ink text-paper rounded-md font-semibold transition-colors shadow-lg disabled:opacity-50"
 >
 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
 {editingItem ? t('admin.btnSaveChanges') : t('admin.btnCreateItem')}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

  {/* ORDER CANCELLATION MODAL */}
  {orderToCancel && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-paper border border-slate rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate pb-4">
          <div>
            <h3 className="font-bold text-ink text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-signal-red" />
              {t('admin.cancelOrderTitle', 'Bestelling Annuleren')} #{orderToCancel.order_id?.split('-')[0]}
            </h3>
            <p className="text-xs text-slate mt-1">
              {t('admin.cancelOrderSubtitle', 'Selecteer een reden of typ een toelichting. De klant ontvangt automatisch een bevestiging per e-mail.')}
            </p>
          </div>
          <button 
            onClick={() => setOrderToCancel(null)}
            className="text-slate hover:text-ink p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order info summary */}
        <div className="bg-mist p-3 rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="text-slate block">Klant:</span>
            <span className="font-bold text-ink">{orderToCancel.users?.full_name || 'Gast'}</span>
          </div>
          <div>
            <span className="text-slate block">E-mail:</span>
            <span className="font-mono text-ink font-medium">{orderToCancel.users?.email || <span className="text-signal-red">Geen e-mail</span>}</span>
          </div>
          <div>
            <span className="text-slate block">Totaal:</span>
            <span className="font-mono font-bold text-ink">€{parseFloat(orderToCancel.total_price || 0).toFixed(2)}</span>
          </div>
        </div>

        {!orderToCancel.users?.email && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2.5 text-xs text-amber-800 dark:text-amber-300">
            {t('admin.noEmailWarning', 'Let op: Geen e-mailadres bekend voor deze klant. De bestelling wordt geannuleerd zonder e-mailnotificatie.')}
          </div>
        )}

        {/* Quick Reason Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-ink uppercase tracking-wider block">
            Snelle Redenen:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CANCEL_PRESET_REASONS.map(preset => {
              const label = t(`admin.${preset.labelKey}`, preset.fallback);
              const isSelected = cancelReason === label;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCancelReason(label)}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                    isSelected 
                      ? 'bg-ink text-paper font-bold border-ink' 
                      : 'bg-paper text-slate border-slate hover:border-ink hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Reason Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-ink uppercase tracking-wider block">
            {t('admin.cancelReasonLabel', 'Reden van annulering (wordt vermeld in de e-mail)')}:
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('admin.cancelReasonPlaceholder', 'Bijv. Ingrediënten niet voorradig, buiten bezorggebied...')}
            rows={3}
            className="w-full bg-paper border border-slate rounded-lg p-3 text-xs font-sans text-ink focus:outline-none focus:border-ink resize-none shadow-xs"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate">
          <button
            type="button"
            onClick={() => setOrderToCancel(null)}
            disabled={isCancelling}
            className="px-4 py-2 rounded-md border border-slate text-xs font-bold text-slate hover:text-ink hover:bg-mist transition-colors"
          >
            {t('admin.btnCancel', 'Sluiten')}
          </button>
          <button
            type="button"
            onClick={handleConfirmCancelOrder}
            disabled={isCancelling}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-signal-red text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            {t('admin.btnConfirmCancel', 'Annuleren & E-mail Verzenden')}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* SINGLE ORDER DELETE CONFIRMATION MODAL */}
  {orderToDelete && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-paper border border-slate rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-signal-red rounded-lg border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-base">
                {t('admin.deleteSingleTitle', 'Bestelling Permanent Verwijderen')}
              </h3>
              <span className="font-mono text-xs text-slate">#{orderToDelete.order_id?.split('-')[0]}</span>
            </div>
          </div>
          <button 
            onClick={() => setOrderToDelete(null)}
            className="text-slate hover:text-ink p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Info Card */}
        <div className="bg-mist p-3.5 rounded-lg space-y-1.5 text-xs border border-slate">
          <div className="flex justify-between">
            <span className="text-slate font-medium">Klant:</span>
            <span className="font-bold text-ink">{orderToDelete.users?.full_name || 'Gast'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate font-medium">Totaal:</span>
            <span className="font-mono font-bold text-ink">€{parseFloat(orderToDelete.total_price || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate font-medium">Status:</span>
            <span className="font-medium text-ink uppercase font-mono">{orderToDelete.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate font-medium">Geplaatst:</span>
            <span className="text-slate">{new Date(orderToDelete.created_at).toLocaleString()}</span>
          </div>
        </div>

        <p className="text-xs text-signal-red font-medium">
          {t('admin.deleteSingleConfirm', { id: orderToDelete.order_id?.split('-')[0], defaultValue: 'Weet u zeker dat u deze bestelling permanent wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.' })}
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate">
          <button
            type="button"
            onClick={() => setOrderToDelete(null)}
            disabled={isDeletingSingle}
            className="px-4 py-2 rounded-md border border-slate text-xs font-bold text-slate hover:text-ink hover:bg-mist transition-colors"
          >
            {t('admin.btnCancel', 'Annuleren')}
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteSingle}
            disabled={isDeletingSingle}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-signal-red text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isDeletingSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('admin.btnConfirmDelete', 'Permanent Verwijderen')}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* BULK TIMEFRAME CLEANUP MODAL */}
  {isBulkDeleteOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-paper border border-slate rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between border-b border-slate pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-signal-red rounded-lg border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-base">
                {t('admin.deleteBulkTitle', 'Bestellingen Opruimen per Periode')}
              </h3>
              <p className="text-xs text-slate mt-0.5">
                {t('admin.deleteBulkSubtitle', 'Wis bestellingen permanent uit de database op basis van een gekozen tijdsperiode.')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsBulkDeleteOpen(false)}
            className="text-slate hover:text-ink p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-ink uppercase tracking-wider block">
            Kies tijdsperiode:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '24h', labelKey: 'timeframe24h', fallback: 'Laatste 24 uur' },
              { id: '7d', labelKey: 'timeframe7d', fallback: 'Laatste week' },
              { id: '30d', labelKey: 'timeframe30d', fallback: 'Laatste maand' },
            ].map(item => {
              const isSelected = bulkTimeframe === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBulkTimeframe(item.id)}
                  className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected 
                      ? 'bg-signal-red/10 border-signal-red text-signal-red font-bold shadow-xs' 
                      : 'bg-mist border-slate text-ink hover:border-slate-400'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">{t(`admin.${item.labelKey}`, item.fallback)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Option A: Safety filter toggle */}
        <div className="p-3 bg-mist rounded-lg border border-slate flex items-start gap-3">
          <input
            type="checkbox"
            id="bulkOnlyCompleted"
            checked={bulkOnlyCompleted}
            onChange={(e) => setBulkOnlyCompleted(e.target.checked)}
            className="mt-0.5 rounded border-slate text-signal-red focus:ring-signal-red cursor-pointer"
          />
          <label htmlFor="bulkOnlyCompleted" className="text-xs text-ink cursor-pointer select-none">
            <span className="font-bold block text-ink">
              {t('admin.bulkOnlyCompletedLabel', 'Alleen voltooide en geannuleerde bestellingen verwijderen')}
            </span>
            <span className="text-slate text-[11px] block mt-0.5">
              Beschermt actieve bestellingen (nieuw, bereiden, onderweg). Schakel dit uit als u ook actieve testbestellingen wilt verwijderen.
            </span>
          </label>
        </div>

        {/* Live Preview Count Box */}
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          matchingBulkOrders.length > 0 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
            : 'bg-mist border-slate text-slate'
        }`}>
          <span className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-signal-red" />
            {matchingBulkOrders.length > 0
              ? t('admin.bulkDeleteMatchingCount', { count: matchingBulkOrders.length, defaultValue: `${matchingBulkOrders.length} bestelling(en) geselecteerd voor verwijdering.` })
              : t('admin.bulkNoOrdersMatching', 'Geen bestellingen gevonden binnen deze criteria.')}
          </span>
          <span className="font-mono font-bold text-sm px-2 py-0.5 bg-paper rounded border border-slate">
            {matchingBulkOrders.length}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate">
          <button
            type="button"
            onClick={() => setIsBulkDeleteOpen(false)}
            disabled={isDeletingBulk}
            className="px-4 py-2 rounded-md border border-slate text-xs font-bold text-slate hover:text-ink hover:bg-mist transition-colors"
          >
            {t('admin.btnCancel', 'Annuleren')}
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteBulk}
            disabled={isDeletingBulk || matchingBulkOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-signal-red text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isDeletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('admin.btnConfirmDelete', 'Permanent Verwijderen')} ({matchingBulkOrders.length})
          </button>
        </div>
      </div>
    </div>
  )}

 </div>
 </div>
 );
};

export default AdminDashboard;