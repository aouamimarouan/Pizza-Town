import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomeView from './components/views/HomeView';
import MenuView from './components/views/MenuView';
import ServicesView from './components/views/ServicesView';
import LocationView from './components/views/LocationView';
import LoginView from './components/views/LoginView';
import ReservationView from './components/views/ReservationView';
import AdminDashboard from './components/views/AdminDashboard';
import MyOrders from './components/views/MyOrders';
import CartWidget from './components/ui/CartWidget';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { logout as authLogout, getStoredUser } from './services/authService.js';

// Normalize the stored user object
const toAppUser = (apiUser) => apiUser
  ? { isLoggedIn: true, role: apiUser.role || 'customer', email: apiUser.email, full_name: apiUser.full_name, user_id: apiUser.user_id }
  : { isLoggedIn: false, role: null, email: '', full_name: '', user_id: null };

// Inner app component so we can use hooks like useNavigate if needed, though most routing is declarative
function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(() => toAppUser(getStoredUser()));
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const navigate = useNavigate();

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
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, [handleLogout]);

  const handleAddToCart = (item) => {
    if (!user.isLoggedIn) {
      alert('Please create an account or log in to place an order.');
      navigate('/login');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    // Subtle success feedback instead of interrupting the user
    toast.success(`🍕 ${item.name} added to cart!`, {
      style: {
        borderRadius: '12px',
        background: '#1c1917',
        color: '#fff',
        border: '1px solid #292524',
      },
    });
  };

  const handleOpenCart = () => {
    if (!user.isLoggedIn) {
      alert('Please create an account or log in to view your cart.');
      navigate('/login');
      return;
    }
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId, change) => {
    setCart((prev) =>
      prev
        .map((item) => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      {/* Toast Notifications */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: { background: isDarkMode ? '#1a1a1a' : '#fff', color: isDarkMode ? '#fff' : '#000', border: '1px solid #292524' }
        }} 
      />

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
          
          {/* Protected Routes */}
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute user={user}>
                <MyOrders />
              </ProtectedRoute>
            } 
          />
          
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

      <Footer />

      <CartWidget
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        cart={cart}
        updateQuantity={handleUpdateQuantity}
        clearCart={clearCart}
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