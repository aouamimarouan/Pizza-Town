// Sound notification utility for Pizza Town Admin
let audioContext = null;

/**
 * Synthesize a 3-tone service bell chime using Web Audio API
 * Works instantly with zero latency, no network files required
 */
export const playWebAudioChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext || audioContext.state === 'suspended') {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    const playTone = (freq, startOffset, gainPeak = 0.5, duration = 1.0) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + startOffset);

      // Natural acoustic bell envelope (punchy attack, smooth exponential decay)
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.linearRampToValueAtTime(gainPeak, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    // Harmonic double chime (D5: 587Hz -> A5: 880Hz -> D6: 1175Hz)
    playTone(587.33, 0.00, 0.45, 0.9);
    playTone(880.00, 0.22, 0.55, 1.1);
    playTone(1174.66, 0.48, 0.65, 1.4);
  } catch (err) {
    console.warn('[SoundAlerts] Web Audio playback error:', err);
  }
};

/**
 * Check if sound notifications are enabled (defaults to true)
 */
export const isSoundAlertEnabled = () => {
  return localStorage.getItem('pizza_town_sound_alerts') !== 'false';
};

/**
 * Enable or disable sound notifications in localStorage
 */
export const setSoundAlertEnabled = (enabled) => {
  localStorage.setItem('pizza_town_sound_alerts', enabled ? 'true' : 'false');
};

/**
 * Warm up / unlock the AudioContext on user interaction
 * Guarantees audio playback will succeed when an order arrives
 */
export const unlockAudio = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!audioContext || audioContext.state === 'suspended') {
        audioContext = new AudioCtx();
      }
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
    }
  } catch (_) {}
};

/**
 * Request native browser notification permissions
 */
export const requestBrowserNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }
  }
};

/**
 * Display a native browser notification (even if browser tab is backgrounded)
 */
export const showNativeNotification = (title, options = {}) => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        ...options
      });
      if (options.onClickUrl) {
        notif.onclick = () => {
          window.focus();
          window.location.href = options.onClickUrl;
        };
      }
    }
  } catch (_) {}
};

/**
 * Play order arrival notification sound (HTML5 audio with Web Audio API fallback)
 */
export const playOrderNotificationSound = (force = false) => {
  if (!force && !isSoundAlertEnabled()) {
    return;
  }

  try {
    unlockAudio();
    const audio = new Audio('/sounds/new-order-alert.mp3');
    audio.volume = 1.0;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Fallback to Web Audio API synthesized chime if HTML5 audio fails or is blocked
        playWebAudioChime();
      });
    }
  } catch (e) {
    playWebAudioChime();
  }
};
