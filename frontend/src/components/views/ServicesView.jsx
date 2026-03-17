import React, { useState } from 'react';
import { Truck, Info, Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api.js';

// Make sure you pass 'user' as a prop from your main App.jsx!
// Example: <ServicesView setActiveTab={setActiveTab} user={user} />
const ServicesView = ({ user }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.isLoggedIn) {
      toast.error('Please log in or create an account to book a table.');
      navigate('/login'); 
      return; 
    }

    setIsLoading(true);
    try {
      await api.post('/reservations', {
        full_name: formData.name,
        phone_number: formData.phone,
        res_date: formData.date,
        res_time: formData.time,
        guests: parseInt(formData.guests, 10),
        user_id: user.user_id
      });
      
      toast.success('Thank you! Your reservation was successful.');
      setFormData({ name: '', phone: '', date: '', time: '', guests: '2' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to make reservation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">Services & Reservations</h2>
        <p className="text-stone-500 dark:text-stone-400 mt-2 text-lg">Choose how you want to experience Pizza Town.</p>
      </div>

      {/* Strict 2-column grid focusing on the two main options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
        
        {/* Left Column: Create an Order */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 shadow-sm border border-stone-100 dark:border-stone-800 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-left gap-6 group hover:border-red-500/30">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-red-100 dark:bg-red-600 flex items-center justify-center text-red-600 dark:text-white transition-transform group-hover:scale-110 shadow-sm shadow-red-900/10">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-3">Create an Order</h3>
              <p className="text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                Browse our delicious menu to choose your favorite pizzas, pastas, and drinks. Add them to your cart and confirm your delivery or takeaway order in just a few clicks.
              </p>
              <button 
                onClick={() => navigate('/menu')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-bold transition-colors border border-red-200 dark:border-red-800/50"
              >
                <Truck className="w-5 h-5 mr-2" />
                Go to Menu
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-[#1a1400] border-l-4 border-amber-500 dark:border-amber-500 rounded-r-2xl rounded-l-md p-6 flex items-start shadow-sm mt-8 transition-colors">
            <Info className="h-6 w-6 text-amber-600 dark:text-amber-500 mr-4 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-500 text-lg mb-1">Payment Options</h4>
              <p className="text-amber-800 dark:text-amber-600 text-sm">
                Cash accepted upon delivery or pickup. Bancontact available in-store.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Reservation Form */}
        <div>
           <div className="bg-white dark:bg-[#0a0a0a] p-8 sm:p-10 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800/60 transition-colors relative overflow-hidden">
             
             {/* Subtle indicator if visitor is not logged in */}
             {(!user || !user.isLoggedIn) && (
                <div className="absolute top-0 left-0 w-full bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 text-xs text-center py-1.5 font-medium border-b border-stone-200 dark:border-stone-800">
                  Account required to book a table
                </div>
             )}

             <h3 className={`text-2xl font-bold text-stone-900 dark:text-white mb-8 font-heading flex items-center ${(!user || !user.isLoggedIn) ? 'mt-4' : ''}`}>
               <Calendar className="w-6 h-6 mr-3 text-red-600 dark:text-red-500" />
               Book a Table
             </h3>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder=" "
                    className="peer w-full px-4 pt-5 pb-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors outline-none"
                  />
                  <label htmlFor="name" className="absolute text-sm text-stone-500 dark:text-stone-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-600 dark:peer-focus:text-red-400 pointer-events-none">
                    Full Name
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder=" "
                    className="peer w-full px-4 pt-5 pb-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors outline-none"
                  />
                  <label htmlFor="phone" className="absolute text-sm text-stone-500 dark:text-stone-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-red-600 dark:peer-focus:text-red-400 pointer-events-none">
                    Phone Number
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 pt-5 pb-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors outline-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <label htmlFor="date" className="absolute text-xs text-stone-500 dark:text-stone-400 top-1 left-4 font-medium pointer-events-none">
                      Date
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      min="17:00"
                      max="22:30"
                      className="w-full px-4 pt-5 pb-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors outline-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <label htmlFor="time" className="absolute text-xs text-stone-500 dark:text-stone-400 top-1 left-4 font-medium pointer-events-none">
                      Time
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    className="w-full px-4 pt-5 pb-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#151515] text-stone-900 dark:text-white focus:bg-white dark:focus:bg-[#151515] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors outline-none appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, '9+'].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                    ))}
                  </select>
                  <label htmlFor="guests" className="absolute text-xs text-stone-500 dark:text-stone-400 top-1 left-4 font-medium pointer-events-none">
                    Number of Guests
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (!user || !user.isLoggedIn)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-stone-400 disabled:cursor-not-allowed text-white font-bold transition-all duration-300 shadow-lg shadow-red-900/20 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-[#0a0a0a] outline-none mt-4 text-lg"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                     'Submit Reservation'
                  )}
                </button>

             </form>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ServicesView;