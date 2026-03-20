import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Pizza, Users, ConciergeBell, Activity, Search,
  CheckCircle, Receipt, MapPin, AlertCircle, Plus, Edit2, Trash2, X, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import socket from '../../services/socket.js';

const AdminDashboard = () => {
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
      toast.error('Failed to load orders.');
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
      
      toast.success('New real-time order received!', {
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

      toast.success('📅 New table reservation received!', {
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
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh the list
    } catch (err) {
      toast.error('Failed to update status.');
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
      toast.error('Failed to load menu items.');
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
      toast.error('Failed to load users.');
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
      toast.error('Failed to load reservations.');
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
      toast.error('Failed to load audit logs.');
    } finally {
      setIsAuditLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'audit') fetchAuditLogs();
  }, [activeAdminTab]);

  const categories = ['Menu Deals', 'Starters', 'Pizzas', 'Pastas', 'Half-Half Pizzas', 'Salads', 'Desserts', 'Drinks'];

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
        toast.success('Menu item updated.');
      } else {
        await api.post('/menu', payload);
        toast.success('Menu item created.');
      }
      setIsMenuModalOpen(false);
      fetchMenuItems();
    } catch (err) {
      toast.error('Failed to save menu item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReservation = async (id) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status: 'confirmed' });
      toast.success('Reservation confirmed!');
      fetchReservations();
    } catch (err) {
      toast.error('Failed to confirm reservation.');
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if(window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/menu/${id}`);
        toast.success('Item deleted.');
        fetchMenuItems();
      } catch (err) {
        toast.error('Failed to delete item.');
      }
    }
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'menu', label: 'Menu Items', icon: Pizza },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reservations', label: 'Reservations', icon: ConciergeBell },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] transition-colors font-sans text-stone-300 pb-20">
      
      {/* COMMAND CENTER HEADER */}
      <header className="border-b border-stone-800 bg-[#0a0a0a] pt-12 pb-6 px-8 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-heading flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-500" />
              Command Center
            </h1>
            <p>Hier kan je alles regelen</p>
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
              <h3 className="text-stone-400 font-medium">Total Orders</h3>
              <span className="bg-stone-800/50 text-stone-300 text-[10px] uppercase font-bold px-2 py-1 rounded border border-stone-700">Today's Volume</span>
            </div>
            <div className="text-5xl font-black text-white font-heading relative z-10">{orders.length}</div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#151515] border border-stone-800 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-stone-400 font-medium">Active Deliveries</h3>
              <span className="bg-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-emerald-800/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                On Route
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
              <h3 className="text-stone-400 font-medium">Menu Items</h3>
              <span className="bg-amber-900/30 text-amber-400 text-[10px] uppercase font-bold px-2 py-1 rounded border border-amber-800/50 flex items-center gap-1">
                Active
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
              Manage Console <span className="text-stone-500 font-normal capitalize">/ {activeAdminTab}</span>
            </h2>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="w-full bg-[#0a0a0a] border border-stone-800 text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 transition-all font-mono placeholder-stone-600"
                />
              </div>
              {activeAdminTab === 'menu' && (
                <button 
                  onClick={() => openMenuModal()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add Item
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
                    <th className="p-4 font-semibold">Order ID</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {orders.map((order) => {
                    const statusFormatted = order.status.replace(/_/g, ' ');
                    const isPending = order.status === 'pending';
                    const isCooking = order.status === 'cooking';
                    const isOut = order.status === 'out_for_delivery';
                    
                    return (
                    <tr key={order.order_id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 font-mono font-medium text-stone-300">#{order.order_id.split('-')[0]}</td>
                      <td className="p-4 text-stone-400">
                        <div className="font-medium text-stone-300">{order.users?.full_name || 'Guest'}</div>
                        <div className="text-xs text-stone-500 mt-1 max-w-[200px] truncate">
                          {order.orderitems?.map(i => `${i.quantity}x ${i.menuitems.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded bg-[#0a0a0a] text-[11px] font-bold uppercase tracking-wider border ${
                          isPending ? 'text-amber-500 border-amber-900/50' :
                          isCooking ? 'text-blue-500 border-blue-900/50' :
                          isOut ? 'text-indigo-500 border-indigo-900/50' :
                          'text-emerald-500 border-emerald-900/50'
                        }`}>
                          {isPending && <ConciergeBell className="w-3 h-3 mr-1.5" />}
                          {isOut && <MapPin className="w-3 h-3 mr-1.5" />}
                          {statusFormatted}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isPending && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'cooking')} className="text-xs bg-stone-800 text-stone-300 hover:text-white border border-stone-700 px-3 py-1.5 rounded hover:bg-stone-700 transition-colors font-semibold">
                            Accept & Cook
                          </button>
                        )}
                        {isCooking && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'out_for_delivery')} className="text-xs bg-indigo-900/40 text-indigo-400 border border-indigo-800/50 px-3 py-1.5 rounded hover:bg-indigo-900/60 transition-colors font-semibold">
                            Send out
                          </button>
                        )}
                        {isOut && (
                          <button onClick={() => handleUpdateStatus(order.order_id, 'delivered')} className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded hover:bg-emerald-900/60 transition-colors font-semibold">
                            Mark Delivered
                          </button>
                        )}
                        {order.status === 'delivered' && (
                           <span className="text-xs text-stone-600 font-mono">Completed</span>
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
                    <th className="p-4 font-semibold">Item Name</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
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
                    <th className="p-4 font-semibold">User details</th>
                    <th className="p-4 font-semibold">Contact</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold text-right">Orders</th>
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
                        <div className="text-xs text-stone-500 mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
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
                    <th className="p-4 font-semibold">Guest</th>
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold text-center">Guests</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
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
                            Confirm
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
                    <th className="p-4 font-semibold">Timestamp</th>
                    <th className="p-4 font-semibold">Admin</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold">Entity</th>
                    <th className="p-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-stone-600 font-medium">No audit logs found.</td>
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
                            <div className="text-stone-300 font-medium">{log.admin?.full_name || 'System'}</div>
                            <div className="text-[10px] text-stone-600 font-mono uppercase">{log.admin?.email || 'automated'}</div>
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
                                : 'No extra data'
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
              <h3 className="text-lg font-medium text-stone-400">Module Under Construction</h3>
              <p className="text-stone-600 text-sm mt-2 max-w-sm">The '{activeAdminTab}' module is currently being provisioned. Please check back later.</p>
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
                {editingItem ? 'Edit Menu Item' : 'Add New Item'}
              </h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-stone-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Item Name</label>
                <input 
                  type="text" 
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Margherita Pizza"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Price (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  required
                  rows="3"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-stone-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Ingredients and details..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-stone-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingItem ? 'Save Changes' : 'Create Item'}
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