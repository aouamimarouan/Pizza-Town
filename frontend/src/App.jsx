import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast, resolveValue } from 'react-hot-toast';
import { Check, AlertCircle, Info } from 'lucide-react';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SplashScreen from './components/layout/SplashScreen';
import HomeView from './components/views/HomeView';
import MenuView from './components/views/MenuView';
import ServicesView from './components/views/ServicesView';
import LocationView from './components/views/LocationView';
import LoginView from './components/views/LoginView';
import ForgotPasswordView from './components/views/ForgotPasswordView';
import ResetPasswordView from './components/views/ResetPasswordView';
import ReservationView from './components/views/ReservationView';
import AdminDashboard from './components/views/AdminDashboard';
import MyOrders from './components/views/MyOrders';
import AccountSettingsView from './components/views/AccountSettingsView';
import ReviewSubmissionView from './components/views/ReviewSubmissionView';
import CartWidget from './components/ui/CartWidget';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { logout as authLogout, getStoredUser } from './services/authService.js';

// Normalize the stored user object
const toAppUser = (apiUser) => apiUser
  ? { isLoggedIn: true, role: apiUser.role || 'customer', email: apiUser.email, full_name: apiUser.full_name, user_id: apiUser.user_id, address: apiUser.address }
  : { isLoggedIn: false, role: null, email: '', full_name: '', user_id: null, address: '' };

const generateCartItemSignature = (item) => {
  if (!item.customizations) return `item-${item.id}`;
  
  // Create a deep copy to sort arrays without mutating
  const cust = JSON.parse(JSON.stringify(item.customizations));
  
  if (cust.toppings && Array.isArray(cust.toppings)) cust.toppings.sort();
  if (cust.halfHalf) {
    if (cust.halfHalf.left && Array.isArray(cust.halfHalf.left)) cust.halfHalf.left.sort();
    if (cust.halfHalf.right && Array.isArray(cust.halfHalf.right)) cust.halfHalf.right.sort();
  }
  if (cust.subItems && Array.isArray(cust.subItems)) {
    cust.subItems.forEach(sub => {
       if (sub.customizations?.toppings && Array.isArray(sub.customizations.toppings)) {
         sub.customizations.toppings.sort();
       }
    });
    cust.subItems.sort((a, b) => a.id - b.id);
  }

  return `item-${item.id}-${JSON.stringify(cust)}`;
};

// Inner app component so we can use hooks like useNavigate if needed, though most routing is declarative
function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(() => toAppUser(getStoredUser()));
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Only show splash screen on root visit, never on direct sub-routes (login, menu, admin, etc.)
    if (window.location.pathname !== '/') return false;
    try {
      const alreadyShown = sessionStorage.getItem('pizza_town_splash_shown');
      if (alreadyShown) return false;
      sessionStorage.setItem('pizza_town_splash_shown', 'true');
      return true;
    } catch {
      return false;
    }
  });

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('pizza_town_splash_shown', 'true');
    } catch (_) {}
    setShowSplash(false);
  }, []);
  
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleAuthSuccess = useCallback((apiUser) => {
    setUser(toAppUser(apiUser));
    navigate('/');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    authLogout();
    setUser({ isLoggedIn: false, role: null, email: '', full_name: '', user_id: null });
    setCart([]);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const onForceLogout = () => handleLogout();
    const onAuthUpdate = () => setUser(toAppUser(getStoredUser()));
    
    window.addEventListener('auth:logout', onForceLogout);
    window.addEventListener('auth:update', onAuthUpdate);
    
    return () => {
      window.removeEventListener('auth:logout', onForceLogout);
      window.removeEventListener('auth:update', onAuthUpdate);
    };
  }, [handleLogout]);

  const handleAddToCart = (item) => {
    if (!user.isLoggedIn) {
      alert('Please create an account or log in to place an order.');
      navigate('/login');
      return;
    }
    
    const signature = generateCartItemSignature(item);
    
    setCart((prev) => {
      const existing = prev.find((c) => (c.cartSignature || c.id) === signature);
      
      if (existing) {
        // Increment quantity for the exact same item/customization
        return prev.map((c) => 
          (c.cartSignature || c.id) === signature 
            ? { ...c, quantity: c.quantity + 1 } 
            : c
        );
      }
      // Add new item, attaching the generated signature
      return [...prev, { ...item, cartSignature: signature, quantity: 1 }];
    });
    
    // Subtle success feedback instead of interrupting the user
    toast.success(`${item.name} added to cart`);
  };

  const handleOpenCart = () => {
    if (!user.isLoggedIn) {
      alert('Please create an account or log in to view your cart.');
      navigate('/login');
      return;
    }
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (signature, change) => {
    setCart((prev) =>
      prev
        .map((item) => (item.cartSignature || item.id) === signature ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`flex flex-col min-h-screen bg-paper text-ink transition-colors ${showSplash ? 'overflow-hidden h-screen' : ''}`}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      
      {/* Custom Toast Notifications */}
      <Toaster 
        position="bottom-center" 
        gutter={8}
        toastOptions={{
          duration: 3500,
        }} 
      >
        {(t) => {
          // Dynamic icon and border based on type
          let Icon = null;
          let iconColor = '';
          let borderColor = 'border-ink';
          
          if (t.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-signal-red';
            borderColor = 'border-signal-red';
          } else if (t.type === 'success') {
            Icon = Check;
            iconColor = 'text-ink';
          } else {
            Icon = Info;
            iconColor = 'text-slate';
          }

          return (
            <div
              style={{
                opacity: t.visible ? 1 : 0,
                transform: t.visible ? 'translateY(0)' : 'translateY(8px)',
                transition: t.visible ? 'all 200ms ease-out' : 'all 150ms ease-in',
              }}
              className={`pointer-events-auto flex items-center px-4 py-3 rounded-md border shadow-sm bg-paper min-w-[200px] max-w-sm ${borderColor}`}
              role="status"
              aria-live="polite"
              onMouseEnter={() => toast.dismiss(t.id)} // Optional: we rely on toastOptions for hover pause, but can't access it easily here without breaking standard behavior. Actually react-hot-toast handles hover pause by default automatically for the entire Toaster.
            >
              <div className={`mr-3 shrink-0 ${iconColor}`}>
                <Icon size={18} strokeWidth={2} />
              </div>
              <p className="text-sm font-sans text-ink leading-tight">
                {resolveValue(t.message, t)}
              </p>
            </div>
          );
        }}
      </Toaster>

      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        cartItemCount={cartItemCount}
        openCart={handleOpenCart}
        user={user}
        onLogout={handleLogout}
        clearCart={clearCart}
      />

      <main className="flex-grow w-full relative">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/menu" element={<MenuView handleAddToCart={handleAddToCart} />} />
          <Route path="/services" element={<ServicesView user={user} />} />
          <Route path="/location" element={<LocationView />} />
          <Route path="/book" element={<ReservationView />} />
          <Route path="/login" element={user.isLoggedIn ? <Navigate to="/" /> : <LoginView onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/forgot-password" element={user.isLoggedIn ? <Navigate to="/" /> : <ForgotPasswordView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          
          <Route path="/review/:orderId" element={
            <ProtectedRoute user={user} allowedRoles={['customer']}>
              <ReviewSubmissionView />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/orders" element={
            <ProtectedRoute user={user} allowedRoles={['customer']}>
              <MyOrders />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute user={user} allowedRoles={['customer']}>
              <AccountSettingsView />
            </ProtectedRoute>
          } />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute user={user} allowedRoles={['admin', 'moderator']}>
                <AdminDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}

      <CartWidget
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        cart={cart}
        updateQuantity={handleUpdateQuantity}
        clearCart={clearCart}
        user={user}
        handleAddToCart={handleAddToCart}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;