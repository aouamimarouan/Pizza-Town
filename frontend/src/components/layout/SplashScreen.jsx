import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import StrokeText from '../ui/StrokeText';

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState('loading'); // loading, exit, hidden

  const handleSkip = () => {
    setPhase('hidden');
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Sequence timing (snappy animation)
    const timers = [
      setTimeout(() => setPhase('exit'), 2000),
      setTimeout(() => {
        setPhase('hidden');
        if (onComplete) onComplete();
      }, 2400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div 
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-paper transition-transform duration-400 ease-in-out cursor-pointer select-none ${
        phase === 'exit' ? '-translate-y-full' : 'translate-y-0'
      }`}
      title="Cliquer pour passer"
    >
      <div className="relative flex flex-col items-center justify-center animate-in fade-in duration-300">
        
        <StrokeText
          text="PIZZA TOWN"
          strokeColor="var(--theme-signal-red)"
          fillColor="var(--theme-ink)"
          strokeWidth={1.5}
          drawDuration={1.2}
          fillDelay={0.1}
          stagger={0.08}
          ease="power2.out"
          trigger="mount"
          fillMode="wipe"
          fontSize={64}
          fontWeight={800}
          className="mb-8 font-display"
        />

        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-signal-red animate-spin mb-4" />
          <span className="text-slate font-mono uppercase tracking-widest text-xs font-bold">
            Loading
          </span>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;
