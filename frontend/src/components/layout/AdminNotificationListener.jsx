import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket from '../../services/socket.js';
import { 
  playOrderNotificationSound, 
  isSoundAlertEnabled,
  unlockAudio, 
  requestBrowserNotificationPermission, 
  showNativeNotification 
} from '../../utils/soundAlerts.js';

/**
 * Global Admin Notification Listener
 * Kept mounted whenever the admin is logged in.
 * Triggers sound alarms, native browser notifications, and interactive toasts
 * everywhere on the website when the admin is outside the /admin dashboard.
 */
const AdminNotificationListener = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location.pathname);

  // Keep locationRef current so socket handlers always know the exact active page
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.isLoggedIn || user?.role !== 'admin') {
      return;
    }

    // Ask for native desktop notification permissions once
    requestBrowserNotificationPermission();

    // Ensure socket joins admin room immediately & on every reconnect
    const joinAdminRoom = () => {
      socket.emit('join_admin');
    };

    if (socket.connected) {
      joinAdminRoom();
    }
    socket.on('connect', joinAdminRoom);

    // ── Handle New Incoming Orders ─────────────────────────────────────────────
    const handleNewOrder = (newOrder) => {
      const isInsideAdmin = locationRef.current.startsWith('/admin');

      // When inside /admin, AdminDashboard.jsx handles in-page table updates and sound
      if (isInsideAdmin) {
        return;
      }

      // 1. Play auditory chime alarm
      if (isSoundAlertEnabled()) {
        playOrderNotificationSound(true);
      }

      // 2. Native OS / Browser notification (works even if looking at another window/app)
      const customerName = newOrder.users?.full_name || 'Klant';
      const totalPrice = parseFloat(newOrder.total_price || 0).toFixed(2);
      const deliveryType = newOrder.delivery_type === 'delivery' ? 'Bezorging / Livraison' : 'Afhalen / À emporter';

      showNativeNotification('🍕 Nieuwe Bestelling Pizza Town!', {
        body: `${customerName} - €${totalPrice} (${deliveryType})`,
        onClickUrl: '/admin'
      });

      // 3. High-visibility interactive banner across any non-admin page
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-paper border-2 border-signal-red shadow-2xl rounded-lg pointer-events-auto flex items-center justify-between p-4 ring-1 ring-black/10 gap-3`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-signal-red/10 border border-signal-red/30 flex items-center justify-center text-xl shrink-0">
              🍕
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">Nieuwe bestelling ontvangen!</p>
              <p className="text-xs text-slate truncate">
                {customerName} · <span className="font-mono font-bold text-signal-red">€{totalPrice}</span> ({deliveryType})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              navigate('/admin');
            }}
            className="px-3.5 py-2 bg-signal-red hover:bg-ink text-paper text-xs font-bold rounded-md transition-colors shrink-0 shadow-sm cursor-pointer whitespace-nowrap"
          >
            Dashboard ➔
          </button>
        </div>
      ), { 
        duration: 12000, 
        position: 'top-right',
        id: `global-order-${newOrder.order_id || Date.now()}`
      });
    };

    // ── Handle New Table Reservations ──────────────────────────────────────────
    const handleNewReservation = (newRes) => {
      const isInsideAdmin = locationRef.current.startsWith('/admin');

      if (isInsideAdmin) {
        return;
      }

      if (isSoundAlertEnabled()) {
        playOrderNotificationSound(true);
      }

      const resName = newRes.full_name || 'Klant';
      const guests = newRes.guests || 1;

      showNativeNotification('🛎️ Nieuwe Tafelreservering Pizza Town!', {
        body: `${resName} (${guests} personen)`,
        onClickUrl: '/admin'
      });

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-paper border-2 border-purple-500 shadow-2xl rounded-lg pointer-events-auto flex items-center justify-between p-4 ring-1 ring-black/10 gap-3`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 border border-purple-300 flex items-center justify-center text-xl shrink-0">
              🛎️
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">Nieuwe tafelreservering!</p>
              <p className="text-xs text-slate truncate">
                {resName} · <span className="font-bold text-purple-600">{guests} personen</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              navigate('/admin');
            }}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-800 text-paper text-xs font-bold rounded-md transition-colors shrink-0 shadow-sm cursor-pointer whitespace-nowrap"
          >
            Dashboard ➔
          </button>
        </div>
      ), { 
        duration: 12000, 
        position: 'top-right',
        id: `global-res-${newRes.res_id || Date.now()}`
      });
    };

    socket.on('new_order', handleNewOrder);
    socket.on('new_reservation', handleNewReservation);

    return () => {
      socket.off('connect', joinAdminRoom);
      socket.off('new_order', handleNewOrder);
      socket.off('new_reservation', handleNewReservation);
    };
  }, [user?.isLoggedIn, user?.role, navigate]);

  return null;
};

export default AdminNotificationListener;
