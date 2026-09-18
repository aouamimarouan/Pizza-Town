// Sound notification utility for Pizza Town
let audioContext = null;
let preloadedBuffer = null;
let isAudioUnlocked = false;
let unlockListenersAttached = false;

/**
 * Get or initialize the shared AudioContext
 */
export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  return audioContext;
};

/**
 * Preload and decode the order alert WAV file into an AudioBuffer in RAM
 * This allows instant, zero-latency playback directly through the Web Audio graph.
 */
export const preloadOrderSound = async () => {
  if (preloadedBuffer || typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const response = await fetch('/sounds/new-order-alert.wav');
    if (!response.ok) return;
    const arrayBuffer = await response.arrayBuffer();
    ctx.decodeAudioData(
      arrayBuffer,
      (decoded) => {
        preloadedBuffer = decoded;
      },
      (err) => {
        console.debug('[SoundAlerts] decodeAudioData error (using synth fallback):', err);
      }
    );
  } catch (err) {
    console.debug('[SoundAlerts] Failed to preload sound file:', err);
  }
};

/**
 * Synthesize a resonant 3-tone service bell chime using Web Audio API
 * Works instantly with zero latency, no network or external audio files required.
 */
export const playWebAudioChime = async () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playBellTone = (fundamentalFreq, startOffset, peakGain = 0.7, duration = 1.2) => {
      // Primary body tone (triangle wave gives a warm acoustic chime bell)
      const oscPrimary = ctx.createOscillator();
      const gainPrimary = ctx.createGain();
      oscPrimary.type = 'triangle';
      oscPrimary.frequency.setValueAtTime(fundamentalFreq, now + startOffset);

      gainPrimary.gain.setValueAtTime(0.0001, now + startOffset);
      gainPrimary.gain.linearRampToValueAtTime(peakGain, now + startOffset + 0.012);
      gainPrimary.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      oscPrimary.connect(gainPrimary);
      gainPrimary.connect(ctx.destination);

      oscPrimary.start(now + startOffset);
      oscPrimary.stop(now + startOffset + duration);

      // Shimmering octave overtone (sine wave gives brass restaurant bell ping)
      const oscOvertone = ctx.createOscillator();
      const gainOvertone = ctx.createGain();
      oscOvertone.type = 'sine';
      oscOvertone.frequency.setValueAtTime(fundamentalFreq * 2, now + startOffset);

      gainOvertone.gain.setValueAtTime(0.0001, now + startOffset);
      gainOvertone.gain.linearRampToValueAtTime(peakGain * 0.35, now + startOffset + 0.008);
      gainOvertone.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + (duration * 0.6));

      oscOvertone.connect(gainOvertone);
      gainOvertone.connect(ctx.destination);

      oscOvertone.start(now + startOffset);
      oscOvertone.stop(now + startOffset + (duration * 0.6));
    };

    // Ascending melodic chime (D5: 587Hz -> A5: 880Hz -> D6: 1175Hz)
    playBellTone(587.33, 0.00, 0.60, 0.9);
    playBellTone(880.00, 0.20, 0.70, 1.1);
    playBellTone(1174.66, 0.44, 0.85, 1.4);
  } catch (err) {
    console.warn('[SoundAlerts] Web Audio chime playback error:', err);
  }
};

/**
 * Play the preloaded WAV AudioBuffer via Web Audio graph
 */
const playAudioBuffer = (ctx) => {
  if (!ctx || !preloadedBuffer) return false;
  try {
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.9, ctx.currentTime);
    source.buffer = preloadedBuffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
    return true;
  } catch (err) {
    console.debug('[SoundAlerts] Buffer playback failed:', err);
    return false;
  }
};

/**
 * Unlock the browser's audio pipeline permanently for this page session.
 * Must be triggered by or inside a user gesture (click, touch, keydown).
 */
export const unlockAudio = async () => {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    // Play an inaudible 1-sample buffer to satisfy browser autoplay restrictions
    if (ctx && ctx.state === 'running') {
      const silentBuf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
    }

    // Pre-warm HTML5 Audio with an inaudible data URI
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudio.volume = 0.01;
      const p = silentAudio.play();
      if (p !== undefined) {
        p.then(() => {
          silentAudio.pause();
          silentAudio.currentTime = 0;
        }).catch(() => {});
      }
    } catch (_) {}

    // Preload sound into memory
    preloadOrderSound();

    isAudioUnlocked = true;
    return true;
  } catch (err) {
    console.debug('[SoundAlerts] unlockAudio error:', err);
    return false;
  }
};

/**
 * Check if the browser audio is unlocked and running
 */
export const checkIsAudioUnlocked = () => {
  if (isAudioUnlocked) return true;
  if (audioContext && audioContext.state === 'running') {
    isAudioUnlocked = true;
    return true;
  }
  return false;
};

/**
 * Setup automatic one-time listeners to unlock audio on the very first user interaction
 */
export const setupAudioAutoUnlock = () => {
  if (typeof window === 'undefined' || unlockListenersAttached) return;
  unlockListenersAttached = true;

  const events = ['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'];
  const handleGesture = () => {
    unlockAudio().then((success) => {
      if (success) {
        events.forEach((evt) => {
          window.removeEventListener(evt, handleGesture, true);
        });
      }
    });
  };

  events.forEach((evt) => {
    window.addEventListener(evt, handleGesture, { capture: true, passive: true });
  });

  // Also preload immediately in case user already granted permissions
  preloadOrderSound();
};

// Auto-initialize unlock listeners on script load
if (typeof window !== 'undefined') {
  setupAudioAutoUnlock();
}

/**
 * Check if sound notifications are enabled (defaults to true)
 */
export const isSoundAlertEnabled = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('pizza_town_sound_alerts') !== 'false';
};

/**
 * Enable or disable sound notifications in localStorage
 */
export const setSoundAlertEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pizza_town_sound_alerts', enabled ? 'true' : 'false');
};

/**
 * Play order arrival notification sound (multi-tiered reliability: AudioBuffer -> HTML5 Audio -> Web Audio Chime)
 */
export const playOrderNotificationSound = (force = false) => {
  if (!force && !isSoundAlertEnabled()) {
    return;
  }

  const ctx = getAudioContext();

  // Tier 1: If AudioContext is running and buffer is ready, play instantly with 0 latency
  if (ctx && ctx.state === 'running') {
    const played = playAudioBuffer(ctx);
    if (played) return;
  }

  // Tier 2: Try HTML5 Audio with the native uncompressed WAV file
  try {
    const audio = new Audio('/sounds/new-order-alert.wav');
    audio.volume = 1.0;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.debug('[SoundAlerts] HTML5 audio play blocked/failed, using synth chime fallback:', err.message);
        playWebAudioChime();
      });
      return;
    }
  } catch (e) {
    // If HTML5 audio constructor fails, proceed to Tier 3
  }

  // Tier 3: Direct Web Audio synthesized chime
  playWebAudioChime();
};
