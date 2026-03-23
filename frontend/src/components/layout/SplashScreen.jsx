import React, { useState, useEffect } from 'react';
import { Pizza } from 'lucide-react';
import logo from '../../assets/pizza_town.png';

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState('spinning'); // spinning, logo, exit, hidden

  useEffect(() => {
    // Sequence timing
    const timers = [
      setTimeout(() => setPhase('logo'), 1500),
      setTimeout(() => setPhase('exit'), 3000),
      setTimeout(() => {
        setPhase('hidden');
        if (onComplete) onComplete();
      }, 3800), // 3000ms + 800ms for exit transition
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-stone-950 transition-transform duration-700 ease-in-out ${
        phase === 'exit' ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center">
        
        {/* Phase 1: Spinning Pizza */}
        <div 
          className={`transition-all duration-700 ease-out transform ${
            phase === 'spinning' 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-50 pointer-events-none absolute'
          }`}
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full animate-pulse"></div>
            <Pizza 
              className="w-32 h-32 text-red-500 animate-[spin_3s_linear_infinite] filter drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Phase 2: Logo Reveal */}
        <div 
          className={`transition-all duration-1000 delay-300 ease-out transform flex flex-col items-center ${
            phase === 'logo' || phase === 'exit'
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-50 pointer-events-none'
          }`}
        >
          <div className="relative group">
            {/* Logo Glow */}
            <div className="absolute inset-0 bg-red-600/30 blur-2xl rounded-full scale-150 animate-pulse"></div>
            <img 
              src={logo} 
              alt="Pizza Town Logo" 
              className="h-32 md:h-48 w-auto relative drop-shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="mt-6 md:mt-8 flex flex-row items-center justify-center w-full px-4 max-w-[90vw] gap-2 md:gap-3">
             <div className="hidden md:block h-[1px] w-12 md:w-16 bg-gradient-to-r from-transparent via-stone-700 to-transparent flex-shrink-0"></div>
             <span className="text-stone-500 uppercase tracking-widest sm:tracking-widest md:tracking-[0.4em] text-[9px] sm:text-[10px] font-bold text-center whitespace-normal md:whitespace-nowrap leading-relaxed">
               De Beste Pizza In Meise En Omstreken
             </span>
             <div className="hidden md:block h-[1px] w-12 md:w-16 bg-gradient-to-r from-transparent via-stone-700 to-transparent flex-shrink-0"></div>
          </div>
        </div>

      </div>

      {/* Subtle Loading Progress Line at Bottom */}
      <div className="absolute bottom-0 left-0 h-1 bg-red-600/30 w-full overflow-hidden">
        <div 
          className={`h-full bg-red-600 transition-all duration-[3000ms] ease-linear ${
            phase === 'spinning' || phase === 'logo' ? 'w-full' : 'w-full opacity-0'
          }`}
          style={{ width: phase === 'spinning' ? '50%' : '100%' }}
        ></div>
      </div>
    </div>
  );
};

export default SplashScreen;
