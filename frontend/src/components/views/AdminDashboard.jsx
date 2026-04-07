import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Pizza, Users, ConciergeBell, Activity, Search,
  CheckCircle, Receipt, MapPin, AlertCircle, Plus, Edit2, Trash2, X, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import socket from '../../services/socket.js';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [activeAdminTab, setActiveAdminTab] = useState('orders');
  
  // --- Orders State ---
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);

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
    if (activeAdminTab === 'orders') fetchOrders();
  }, [activeAdminTab]);
  useEffect(() => {
    socket.emit('join_admin');

    socket.on('new_order', (newOrder) => {
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

    return () => {
      socket.off('new_order');
      socket.off('new_reservation');
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

  const categories = ['Menu Deals', 'Starters', 'Pizzas', 'Pastas', 'Half-Half Pizzas', 'Salads', 'Desserts', 'Drinks', 'Sauces'];

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
    { id: 'orders', label: t('admin.tabOrders'), icon: ShoppingBag },
    { id: 'menu', label: t('admin.tabMenu'), icon: Pizza },
    { id: 'users', label: t('admin.tabUsers'), icon: Users },
    { id: 'reservations', label: t('admin.tabRes'), icon: ConciergeBell },
    { id: 'audit', label: t('admin.tabAudit'), icon: Activity },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] transition-colors font-sans text-stone-300 pb-20">
      
      {/* COMMAND CENTER HEADER */}
      <header className="border-b border-stone-800 bg-[#0a0a0a] pt-12 pb-6 px-8 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-heading flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-500" />
              {t('admin.headerTitle')}
            </h1>
            <p>{t('admin.headerSubtitle')}</p>
          </div>
          
          <div className="flex bg-[#151515] p-1 rounded-xl border border-stone-800 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeAdminTab === tab.id
                      ? 'bg-[#222] text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-300 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-8 py-8 w-full max-w-7xl mx-auto space-y-8">
        
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#151515] border border-stone-800 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Receipt className="w-24 h-24 text-stone-500" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-stone-400 font-medium">{t('admin.statTotalOrders')}</h3>
              <span className="bg-stone-800/50 text-stone-300 text-[10px] uppercase font-bold px-2 py-1 rounded border border-stone-700">{t('admin.statTodayVol')}</span>
            </div>
            <div className="text-5xl font-black text-white font-heading relative z-10">{orders.length}</div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#151515] border border-stone-800 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-stone-400 font-medium">{t('admin.statDeliveries')}</h3>
              <span className="bg-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-emerald-800/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('admin.statOnRoute')}
              </span>
            </div>
            <div className="text-5xl font-black text-white font-heading relative z-10">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#151515] border border-stone-800 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Pizza className="w-24 h-24 text-amber-500" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-stone-400 font-medium">{t('admin.statMenu')}</h3>
              <span className="bg-amber-900/30 text-amber-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-amber-800/50 flex items-center gap-1">
                {t('admin.statActive')}
              </span>
            </div>
            <div className="text-5xl font-black text-white font-heading relative z-10">{menuItems.length}</div>
          </div>
        </div>

        {/* DATA TABLE WRAPPER */}
        <div className="bg-[#151515] border border-stone-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          
          <div className="p-6 border-b border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#111]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
              {t('admin.manageConsole')} <span className="text-stone-500 font-normal capitalize">/ {tabs.find(t => t.id === activeAdminTab)?.label}</span>
            </h2>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder={t('admin.searchPlaceholder')}
                  className="w-full bg-[#0a0a0a] border border-stone-800 text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all font-mono placeholder-stone-600"
                />
              </div>
              {activeAdminTab === 'menu' && (
                <button 
                  onClick={() => openMenuModal()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> {t('admin.btnAddItem')}
                </button>
              )}
            </div>
          </div>

          {/* --- TAB: ORDERS --- */}
          {activeAdminTab === 'orders' ? (
            isOrdersLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] text-stone-500 border-b border-stone-800 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t('admin.colOrderId')}</th>
                    <th className="p-4 font-semibold">{t('admin.colCustomer')}</th>
                    <th className="p-4 font-semibold">{t('admin.colStatus')}</th>
                    <th className="p-4 font-semibold text-right">{t('admin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {orders.map((order) => {
                    // STEP 1: Debugging the raw order structure
                    console.log('DEBUG ORDER:', order);

                    const statusFormatted = order.status?.replace(/_/g, ' ') || 'pending';
                    const isPending = order.status === 'pending';
                    const isCooking = order.status === 'cooking';
                    const isOut = order.status === 'out_for_delivery';
                    
                    return (
                    <tr key={order.order_id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 font-mono font-medium text-stone-300">#{order.order_id?.split('-')[0]}</td>
                      <td className="p-4 text-stone-400">
                        <div className="font-medium text-stone-300">{order.users?.full_name || t('admin.guestUser')}</div>
                        
                        {/* STEP 3: Robust Mapping for Order Items and Nested Selections */}
                        <div className="text-xs text-stone-500 mt-1 space-y-2">
                          {order.items?.map((item, idx) => {
                            // Ensure customizations is an object if it comes as a string
                            const customizations = typeof item.customizations === 'string' 
                              ? JSON.parse(item.customizations) 
                              : item.customizations;

                            return (
                              <div key={item.id || idx} className="flex flex-col">
                                <span className="font-semibold text-stone-300">
                                  {item.quantity}x {item.menuitems?.name}
                                </span>
                                
                                {/* Render Nested Selections / Customizations (Robust Support) */}
                                {(customizations?.crust || customizations?.toppings?.length > 0 || customizations?.subItems?.length > 0 || customizations?.extras?.length > 0) && (
                                  <ul className="ml-4 mt-1 space-y-1 border-l border-stone-800 pl-3">
                                    {/* Handle Crust */}
                                    {customizations?.crust && (
                                      <li className="text-[10px] text-stone-400 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-stone-700"></span>
                                        <span className="italic font-medium">{t('Crust') || 'Crust'}:</span> {customizations.crust.name}
                                      </li>
                                    )}
                                    
                                    {/* Handle Toppings (Standard Format) */}
                                    {customizations?.toppings?.map((topping, tIdx) => (
                                      <li key={`top-${tIdx}`} className="text-[10px] text-emerald-500/80 flex items-center gap-2 font-medium">
                                        <span className="w-1 h-1 rounded-full bg-emerald-900/50"></span>
                                        + {topping}
                                      </li>
                                    ))}

                                    {/* Handle subItems (Deals/Combos Format) */}
                                    {customizations?.subItems?.map((sub, sIdx) => {
                                      const subCust = sub.customizations;
                                      return (
                                        <li key={`sub-${sIdx}`} className="text-[10px] text-stone-300 flex flex-col gap-0.5 pb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-stone-500"></span>
                                            <span className="font-bold">{sub.quantity > 1 ? `${sub.quantity}x ` : ''}{sub.name}</span>
                                          </div>
                                          {subCust && (
                                            <div className="ml-3 pl-2 border-l border-stone-800 space-y-0.5 opacity-70">
                                              {subCust.crust && <div>- {subCust.crust.name}</div>}
                                              {subCust.toppings && subCust.toppings.length > 0 && (
                                                <div className="text-emerald-600">+ {subCust.toppings.join(', ')}</div>
                                              )}
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}

                                    {/* Handle extras (Generic Format) */}
                                    {customizations?.extras?.map((extra, eIdx) => (
                                      <li key={`extra-${eIdx}`} className="text-[10px] text-emerald-600/60 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-emerald-900/50"></span>
                                        + {extra.name}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* --- NEW: Conditional Address / Pickup Label --- */}
                        <div className="mt-2 flex flex-col gap-0.5">
                          {order.delivery_type === 'delivery' ? (
                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 italic">
                              <MapPin className="w-3 h-3 text-red-500/70" />
                              <span className="truncate max-w-[180px]">{order.users?.address || 'No address provided'}</span>
                              {order.users?.phone_number && <span className="text-stone-600">• {order.users.phone_number}</span>}
                            </div>
                          ) : (
                            <div className="text-[11px] text-stone-600 flex items-center gap-1.5 italic">
                              <span>🛍️ {t('Store Pickup') || 'Store Pickup'}</span>
                            </div>
                          )}
                        </div>
                        {/* ---------------------------------------------- */}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded bg-[#0a0a0a] text-[11px] font-bold uppercase tracking-wider border ${
                          isPending ? 'text-amber-500 border-amber-900/50' :
                          isCooking ? 'text-blue-500 border-blue-900/50' :
                          (isOut || order.status === 'ready_for_pickup') ? 'text-indigo-500 border-indigo-900/50' :
                          'text-emerald-500 border-emerald-900/50'
                        }`}>
                          {(isPending || isCooking) && <ConciergeBell className="w-3 h-3 mr-1.5" />}
                          {isOut && <MapPin className="w-3 h-3 mr-1.5" />}
                          {order.status === 'ready_for_pickup' && <ShoppingBag className="w-3 h-3 mr-1.5" />}
                          {statusFormatted}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {/* 1. Common Next Step: Accept/Cook */}
                        {isPending && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'cooking')} className="text-xs bg-stone-800 text-stone-300 hover:text-white border border-stone-700 px-3 py-1.5 rounded hover:bg-stone-700 transition-colors font-semibold">
                            {t('admin.btnAcceptCook')}
                          </button>
                        )}

                        {/* 2. Branch: Delivery Flow */}
                        {isCooking && order.delivery_type === 'delivery' && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'out_for_delivery')} className="text-xs bg-indigo-900/40 text-indigo-400 border border-indigo-800/50 px-3 py-1.5 rounded hover:bg-indigo-900/60 transition-colors font-semibold">
                            {t('admin.btnSendOut')}
                          </button>
                        )}
                        {isOut && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'delivered')} className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded hover:bg-emerald-900/60 transition-colors font-semibold">
                            {t('admin.btnMarkDelivered')}
                          </button>
                        )}

                        {/* 3. Branch: Takeaway Flow */}
                        {isCooking && order.delivery_type === 'takeaway' && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'ready_for_pickup')} className="text-xs bg-indigo-900/40 text-indigo-400 border border-indigo-800/50 px-3 py-1.5 rounded hover:bg-indigo-900/60 transition-colors font-semibold">
                            {t('admin.btnReadyPickup')}
                          </button>
                        )}
                        {order.status === 'ready_for_pickup' && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'picked_up')} className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded hover:bg-emerald-900/60 transition-colors font-semibold">
                            {t('admin.btnMarkPickedUp')}
                          </button>
                        )}

                        {/* 4. Completion State */}
                        {(order.status === 'delivered' || order.status === 'picked_up') && (
                           <span className="text-xs text-stone-600 font-mono italic">{t('admin.lblCompleted')}</span>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            )

          /* --- TAB: MENU ITEMS --- */
          ) : activeAdminTab === 'menu' ? (
             isMenuLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] text-stone-500 border-b border-stone-800 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t('admin.colItemName')}</th>
                    <th className="p-4 font-semibold">{t('admin.colCategory')}</th>
                    <th className="p-4 font-semibold">{t('admin.colPrice')}</th>
                    <th className="p-4 font-semibold text-right">{t('admin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {menuItems.map((item) => (
                    <tr key={item.item_id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 text-stone-400">
                        <div className="font-medium text-stone-300">{item.name}</div>
                        <div className="text-xs text-stone-500 mt-1 max-w-[250px] truncate">{item.description}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-stone-800 text-stone-300 rounded text-xs border border-stone-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-emerald-400">€{parseFloat(item.price).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openMenuModal(item)} className="p-1.5 bg-stone-800 text-stone-400 hover:text-white rounded border border-stone-700 hover:bg-stone-700 transition-colors">
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
               <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] text-stone-500 border-b border-stone-800 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t('admin.colUser')}</th>
                    <th className="p-4 font-semibold">{t('admin.colContact')}</th>
                    <th className="p-4 font-semibold">{t('admin.colRole')}</th>
                    <th className="p-4 font-semibold text-right">{t('admin.colOrders')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 text-stone-400">
                        <div className="font-medium text-stone-300 flex items-center gap-2">
                          <Users className="w-4 h-4 text-stone-600" />
                          {user.full_name}
                        </div>
                        <div className="text-xs text-stone-500 mt-1">{t('admin.joinedAt', { date: new Date(user.created_at).toLocaleDateString() })}</div>
                      </td>
                      <td className="p-4 text-stone-400 text-xs space-y-1">
                        <div>{user.email}</div>
                        {user.phone_number && <div>{user.phone_number}</div>}
                        {user.address && <div className="truncate max-w-[200px] text-stone-500">{user.address}</div>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs border uppercase tracking-wider font-bold ${
                          user.role === 'admin' 
                            ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' 
                            : 'bg-stone-800 text-stone-400 border-stone-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-right text-stone-300">
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
               <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] text-stone-500 border-b border-stone-800 font-mono text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t('admin.colGuest')}</th>
                    <th className="p-4 font-semibold">{t('admin.colDateTime')}</th>
                    <th className="p-4 font-semibold text-center">{t('admin.colGuestsCount')}</th>
                    <th className="p-4 font-semibold">{t('admin.colStatus')}</th>
                    <th className="p-4 font-semibold text-right">{t('admin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {reservations.map((res) => {
                    const isPending = res.status === 'pending';
                    return (
                    <tr key={res.res_id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 text-stone-400">
                        <div className="font-medium text-stone-300">{res.full_name}</div>
                        <div className="text-xs text-stone-500 mt-1">{res.phone_number}</div>
                      </td>
                      <td className="p-4 text-stone-400">
                        <div>{new Date(res.res_date).toLocaleDateString()}</div>
                        <div className="text-xs text-stone-500 mt-1">{new Date(res.res_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="p-4 text-center text-stone-300">
                        {res.guests}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                          isPending ? 'text-amber-500 border-amber-900/50' : 'text-emerald-500 border-emerald-900/50'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isPending && (
                          <button 
                            onClick={() => handleConfirmReservation(res.res_id)}
                            className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded hover:bg-emerald-900/60 transition-colors font-semibold"
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
               <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-stone-500" /></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] text-stone-500 border-b border-stone-800 font-mono text-xs uppercase tracking-wider">
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
                      <td colSpan="5" className="p-12 text-center text-stone-600 font-medium">{t('admin.noAuditLogs')}</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const isDelete = log.action === 'DELETE';
                      const isCreate = log.action === 'CREATE';
                      const isUpdate = log.action === 'UPDATE';
                      
                      return (
                        <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="p-4 text-stone-500 font-mono text-[11px]">
                            {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="p-4">
                            <div className="text-stone-300 font-medium">{log.admin?.full_name || t('admin.systemAdmin')}</div>
                            <div className="text-[10px] text-stone-600 font-mono uppercase">{log.admin?.email || t('admin.automatedAdmin')}</div>
                          </td>
                          <td className="p-4">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                               isDelete ? 'bg-red-950/20 text-red-500 border-red-900/50' :
                               isCreate ? 'bg-emerald-950/20 text-emerald-500 border-emerald-900/50' :
                               'bg-blue-950/20 text-blue-500 border-blue-900/50'
                             }`}>
                               {log.action}
                             </span>
                          </td>
                          <td className="p-4">
                            <div className="text-stone-400 font-medium">{log.entity_type}</div>
                            <div className="text-[10px] text-stone-600 font-mono truncate max-w-[100px]">{log.entity_id}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-stone-500 text-xs italic line-clamp-2 max-w-[200px]">
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
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center h-64 border-t border-stone-800">
              <Activity className="w-12 h-12 text-stone-800 mb-4" />
              <h3 className="text-lg font-medium text-stone-400">{t('admin.constrTitle')}</h3>
              <p className="text-stone-600 text-sm mt-2 max-w-sm">{t('admin.constrDesc', { module: activeAdminTab })}</p>
            </div>
          )}
          
        </div>
      </main>

      {/* --- MENU ITEM MODAL --- */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-stone-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="text-lg font-bold text-white">
                {editingItem ? t('admin.editMenuItem') : t('admin.addMenuItem')}
              </h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-stone-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{t('admin.lblItemName')}</label>
                <input 
                  type="text" 
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder={t('admin.plhItemName')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{t('admin.lblCategory')}</label>
                  <select 
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{t('admin.lblPrice')}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    placeholder={t('admin.plhPrice')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{t('admin.lblDesc')}</label>
                <textarea 
                  rows="3"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  placeholder={t('admin.plhDesc')}
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-stone-400 hover:text-white transition-colors"
                >
                  {t('admin.btnCancel')}
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingItem ? t('admin.btnSaveChanges') : t('admin.btnCreateItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;