import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, ShoppingCart, User, Settings, LogOut, LayoutDashboard, Package, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import logo from '../../assets/pizza_town.png';

const Navbar = ({ isDarkMode, toggleDarkMode, cartItemCount, openCart, user, onLogout, clearCart }) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const dropdownRef = useRef(null);
  
  const initials = user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'US';
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handlePulse = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 300); // Reset after animation
    };
    window.addEventListener('cart:pulse', handlePulse);
    return () => window.removeEventListener('cart:pulse', handlePulse);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout(); 
  };

  const navLinks = [
    { id: '/', label: t('navbar.home') },
    { id: '/menu', label: t('navbar.menu') },
    { id: '/book', label: t('navbar.bookTable') },
    { id: '/services', label: t('navbar.services') },
    { id: '/location', label: t('navbar.location') },
  ];

  return (
    <nav className="bg-paper border-b border-mist sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center">
            {/* Logo */}
            <Link 
              to="/"
              className="shrink-0 flex items-center cursor-pointer group mr-1 sm:mr-2"
            >
              <img 
                src={logo} 
                alt="Pizza Town Logo" 
                className="h-7 sm:h-8 md:h-10 w-auto mr-1.5 sm:mr-2 md:mr-3" 
              />
              <span className="font-display font-bold text-base sm:text-lg md:text-2xl text-signal-red tracking-tight whitespace-nowrap">
                Pizza Town
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.id}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-150 ${
                    location.pathname === link.id
                      ? 'border-signal-red text-ink'
                      : 'border-transparent text-slate hover:text-ink hover:border-mist'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3 md:space-x-4">
            
            {/* Desktop Only Phone & Language */}
            <div className="hidden lg:flex items-center space-x-4">
              <a href="tel:022697176" className="inline-flex items-center text-slate hover:text-ink transition-colors">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium font-mono">02 269 71 76</span>
              </a>
              <div className="h-6 w-px bg-mist mx-2"></div>
              <LanguageSwitcher />
            </div>

            {/* Dark Mode Toggle - Preserved but restyled to be flat */}
            <button 
              onClick={toggleDarkMode}
              className="hidden md:flex p-2 rounded-md text-slate hover:bg-mist hover:text-ink transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Login/Dropdown - Always Visible */}
            {user?.isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 md:gap-3 rounded-md bg-paper border border-mist p-1 md:pr-4 hover:border-slate transition-all focus:outline-none focus:ring-1 focus:ring-signal-red"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 rounded-md bg-ink flex items-center justify-center shrink-0 border border-mist text-paper font-display font-bold text-xs sm:text-sm">
                    {initials}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-ink font-bold text-sm">{user.full_name?.split(' ')[0] || 'User'}</span>
                    {user.role === 'admin' || user.role === 'moderator' ? (
                      <span className="text-signal-red font-bold text-[10px] tracking-wider uppercase font-mono">{user.role}</span>
                    ) : (
                      <span className="text-slate font-bold text-[10px] tracking-wider uppercase font-mono">Member</span>
                    )}
                  </div>
                  <Settings className="hidden md:block w-4 h-4 text-slate ml-1" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-paper border border-mist rounded-md shadow-lg py-2 z-50 text-ink">
                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <>
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center hover:bg-mist transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3 text-slate" />
                          {t('navbar.admin')}
                        </button>
                        <div className="h-px bg-mist my-1 mx-2"></div>
                      </>
                    )}

                    {user?.role !== 'admin' && user?.role !== 'moderator' && (
                      <>
                        <button
                          onClick={() => {
                            navigate('/orders');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center hover:bg-mist transition-colors"
                        >
                          <Package className="w-4 h-4 mr-3 text-slate" />
                          {t('navbar.myOrders')}
                        </button>
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center hover:bg-mist transition-colors"
                        >
                          <Settings className="w-4 h-4 mr-3 text-slate" />
                          Account Settings
                        </button>
                        <div className="h-px bg-mist my-1 mx-2"></div>
                      </>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 flex items-center text-signal-red hover:bg-mist transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {t('navbar.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login"
                className="p-2 rounded-md text-slate hover:bg-mist hover:text-ink transition-colors"
                aria-label="Login / Account"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Cart - Visible only to logged in customers */}
            {user?.isLoggedIn && user?.role !== 'admin' && user?.role !== 'moderator' && (
              <button 
                onClick={openCart}
                className={`relative p-1.5 sm:p-2 rounded-md transition-all duration-150 ${isPulsing ? 'bg-signal-red text-white scale-110' : 'bg-mist text-ink hover:bg-slate hover:text-paper'}`}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                {cartItemCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] font-bold font-mono w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isPulsing ? 'bg-ink' : 'bg-signal-red'}`}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-1 sm:p-2 rounded-md text-slate hover:text-ink hover:bg-mist focus:outline-none transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      <div 
        className={`md:hidden absolute w-full bg-paper border-b border-mist shadow-lg transition-all duration-150 ease-out ${
          isMobileMenuOpen ? 'max-h-[32rem] opacity-100 visible' : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              to={link.id}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium transition-colors ${
                location.pathname === link.id
                  ? 'bg-mist text-ink font-bold border-l-4 border-signal-red'
                  : 'text-slate hover:bg-mist hover:text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="pt-4 mt-2 border-t border-mist px-3 flex flex-col space-y-4">
            {/* Phone & Contact */}
            <a href="tel:022697176" className="flex items-center text-ink py-2 font-mono">
              <Phone className="h-5 w-5 mr-3 text-slate" />
              02 269 71 76
            </a>
            
            {/* Language & Dark Mode */}
            <div className="flex items-center justify-between py-2 gap-4">
              <LanguageSwitcher />
              
              <button 
                onClick={toggleDarkMode}
                className="flex p-2 flex-1 justify-center items-center gap-2 rounded-md bg-mist text-slate hover:bg-slate hover:text-paper transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-5 w-5" />
                    <span className="text-sm font-medium">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    <span className="text-sm font-medium">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;