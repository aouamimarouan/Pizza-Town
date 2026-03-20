import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, User, Send, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api.js';
import socket from '../../services/socket.js';
import toast from 'react-hot-toast';
import { getStoredUser } from '../../services/authService.js';

const ReservationView = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    res_date: '',
    res_time: '',
    guests: 2
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    // Join a private room for this user to receive confirmation notifications
    if (user && user.user_id) {
      socket.emit('join_user', user.user_id);
    }

    const handleConfirmed = (reservation) => {
      toast.success(`✅ Your table for ${reservation.guests} guests on ${new Date(reservation.res_date).toLocaleDateString()} has been confirmed!`, {
        duration: 10000,
        icon: '🍕',
        style: {
          borderRadius: '12px',
          background: '#1c1917',
          color: '#fff',
          border: '1px solid #292524',
        },
      });
    };

    socket.on('reservation_confirmed', handleConfirmed);

    return () => {
      socket.off('reservation_confirmed', handleConfirmed);
    };
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/reservations', {
        ...formData,
        user_id: user ? user.user_id : null
      });
      setIsSuccess(true);
      toast.success('Reservation request sent! We will notify you once confirmed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reservation request.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-4 uppercase tracking-tighter">Reservation Sent!</h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-md mx-auto">
          We've received your request for <strong>{formData.guests} guests</strong> on <strong>{new Date(formData.res_date).toLocaleDateString()}</strong>. 
          Stay on this page or keep exploring; we'll notify you here as soon as it's confirmed!
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="px-8 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          Book Another Table
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Info */}
        <div className="space-y-6">
          <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            Table Booking
          </div>
          <h1 className="text-5xl font-black text-stone-900 dark:text-white leading-none uppercase tracking-tighter">
            Reserve Your <span className="text-red-600">Spot</span>
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg">
            Join us for an authentic artisan pizza experience. Secure your table in seconds and get real-time confirmation.
          </p>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white">Quick Confirmation</h4>
                <p className="text-xs text-stone-500">Our team reviews requests instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-white">Group Friendly</h4>
                <p className="text-xs text-stone-500">Special seating for large parties available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white dark:bg-[#111] border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <User className="w-3 h-3" /> Full Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="+31 6 12345678"
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input 
                  type="date" 
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                  value={formData.res_date}
                  onChange={(e) => setFormData({...formData, res_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Time
                </label>
                <input 
                  type="time" 
                  required
                  className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                  value={formData.res_time}
                  onChange={(e) => setFormData({...formData, res_time: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" /> Guests
              </label>
              <select 
                className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors appearance-none"
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5,6,7,8,10,12].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-tighter py-4 rounded-2xl shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Request Reservation</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ReservationView;
