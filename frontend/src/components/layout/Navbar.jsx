import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, ShoppingCart, Sun, Moon, User, Settings, LogOut, LayoutDashboard, Package } from 'lucide-react';

const Navbar = ({ isDarkMode, toggleDarkMode, cartItemCount, openCart, user, onLogout, clearCart }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
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

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout(); 
  };

  const navLinks = [
    { id: '/', label: 'Home' },
    { id: '/menu', label: 'Menu' },
    { id: '/services', label: 'Services' },
    { id: '/location', label: 'Location' },
  ];

  return (
    <nav className="bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            {/* Logo */}
            <Link 
              to="/"
              className="flex-shrink-0 flex items-center cursor-pointer"
            >
              <span className="font-heading font-extrabold text-2xl text-red-600 dark:text-red-500 tracking-tighter transition-colors">
                Pizza Town
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.id}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    location.pathname === link.id
                      ? 'border-red-600 text-stone-900 dark:text-white'
                      : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a href="tel:022697176" className="inline-flex items-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">02 269 71 76</span>
            </a>
            
            <div className="h-6 w-px bg-stone-200 dark:bg-stone-700 mx-2"></div>
            
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user.isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 rounded-full bg-stone-900 border border-stone-800 p-1 pr-4 hover:border-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center shrink-0 border border-stone-700 text-stone-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-white font-bold text-sm">{user.full_name?.split(' ')[0] || 'User'}</span>
                    {user.role === 'admin' || user.role === 'moderator' ? (
                      <span className="text-amber-500 font-bold text-[10px] tracking-wider uppercase">{user.role}</span>
                    ) : (
                      <span className="text-emerald-500 font-bold text-[10px] tracking-wider uppercase">Member</span>
                    )}
                  </div>
                  <Settings className="w-4 h-4 text-stone-400 ml-1" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#1a1a1a] border border-stone-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <>
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center text-stone-200 hover:bg-stone-800 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3 text-stone-400" />
                          Administration
                        </button>
                        <div className="h-px bg-stone-800 my-1 mx-2"></div>
                      </>
                    )}

                    <button
                      onClick={() => {
                        navigate('/orders');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center text-stone-200 hover:bg-stone-800 hover:text-white transition-colors"
                    >
                      <Package className="w-4 h-4 mr-3 text-stone-400" />
                      My Orders
                    </button>
                    
                    <div className="h-px bg-stone-800 my-1 mx-2"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 flex items-center text-red-400 hover:bg-red-950/30 transition-colors group"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-500 group-hover:text-red-400" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login"
                className="p-2 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition-colors"
                aria-label="Login / Account"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <button 
              onClick={openCart}
              className="relative p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-2">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden absolute w-full bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 shadow-xl transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100 visible' : 'max-h-0 opacity-0 invisible overflow-hidden'
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
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium transition-colors ${
                location.pathname === '/login'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Login / Account
          </Link>
          <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800 px-3 flex justify-between items-center">
             <a href="tel:022697176" className="flex items-center text-stone-700 dark:text-stone-300 py-2">
              <Phone className="h-5 w-5 mr-3 text-stone-400 dark:text-stone-500" />
              02 269 71 76
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;