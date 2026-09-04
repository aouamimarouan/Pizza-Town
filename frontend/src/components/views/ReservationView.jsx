import React, { useState, useEffect } from 'react';
import { Calendar, ConciergeBell, UtensilsCrossed, Phone, User, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import socket from '../../services/socket.js';
import toast from 'react-hot-toast';
import { getStoredUser } from '../../services/authService.js';
import SpecularButton from '../ui/SpecularButton';

const ReservationView = () => {
  const { t } = useTranslation();
  const user = getStoredUser();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    res_date: '',
    res_time: '',
    guests: 2
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Join a private room for this user to receive confirmation notifications
    if (user && user.user_id) {
      socket.emit('join_user', user.user_id);
    }

    const handleConfirmed = (reservation) => {
      toast.success(t('reservation.toastConfirmed', { 
        count: reservation.guests, 
        date: new Date(reservation.res_date).toLocaleDateString() 
      }));
    };

    socket.on('reservation_confirmed', handleConfirmed);

    return () => {
      socket.off('reservation_confirmed', handleConfirmed);
    };
  }, [user, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/reservations', {
        ...formData
      });
      setIsSuccess(true);
      toast.success(t('reservation.toastSent'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('reservation.toastError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
        <div className="bg-mist p-10 rounded-md border border-slate shadow-sm">
          <h2 className="text-3xl font-bold font-display text-ink mb-4 tracking-tight">{t('reservation.successTitle')}</h2>
          <p className="text-slate font-sans mb-8">
            {t('reservation.successDesc', { 
              count: formData.guests, 
              date: new Date(formData.res_date).toLocaleDateString() 
            })}
          </p>
          <button onClick={() => setIsSuccess(false)} className="bg-ink text-paper font-sans font-medium px-6 py-3 rounded-md hover:bg-slate transition-colors">
            {t('reservation.bookAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Info */}
        <div className="space-y-6">
          <div className="inline-block px-3 py-1 bg-mist text-slate border border-slate rounded-sm text-xs font-bold uppercase tracking-widest mb-2 font-sans">
            {t('reservation.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-ink leading-none tracking-tight">
            {t('reservation.title')} <span className="text-signal-red">{t('reservation.titleAccent')}</span>
          </h1>
          <p className="text-slate text-lg font-sans">
            {t('reservation.description')}
          </p>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 p-4 bg-mist border border-slate rounded-md">
              <div className="w-12 h-12 bg-paper border border-slate rounded-sm flex items-center justify-center text-ink shrink-0">
                <ConciergeBell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-ink font-sans">{t('reservation.quickConfirm')}</h4>
                <p className="text-sm text-slate font-sans">{t('reservation.quickConfirmDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-mist border border-slate rounded-md">
              <div className="w-12 h-12 bg-paper border border-slate rounded-sm flex items-center justify-center text-ink shrink-0">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-ink font-sans">{t('reservation.groupFriendly')}</h4>
                <p className="text-sm text-slate font-sans">{t('reservation.groupFriendlyDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-paper border border-mist rounded-md p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                   {t('reservation.fullName')}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-3 focus:outline-none focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                   Email
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="email@example.com"
                  className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-3 focus:outline-none focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors font-mono"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                   {t('reservation.phone')}
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="0412 345 678"
                  className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-3 focus:outline-none focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors font-mono"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                   {t('reservation.date')}
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]}
                    className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-3 focus:outline-none focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors font-mono"
                    value={formData.res_date}
                    onChange={(e) => setFormData({...formData, res_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                   {t('reservation.time')}
                </label>
                <div className="relative">
                  <input 
                    type="time" 
                    required
                    min="11:00"
                    max="23:00"
                    className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-3 focus:outline-none focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors font-mono"
                    value={formData.res_time}
                    onChange={(e) => setFormData({...formData, res_time: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-ink mb-2">
                {t('reservation.guests')}
              </label>
              <select 
                className="w-full bg-paper border border-slate text-ink rounded-md px-4 py-3 focus:outline-none focus:border-signal-red focus:ring-1 focus:ring-signal-red transition-colors font-sans"
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5,6,7,8,10,12].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? t('reservation.guest_singular') : t('reservation.guest_plural')}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-signal-red text-paper font-sans font-bold py-4 rounded-md hover:opacity-90 transition-opacity flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('reservation.requestBtn')}</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ReservationView;
