// Sound notification utility for Pizza Town Admin
let audioContext = null;
let persistentAudio = null;
let isAudioPrimed = false;

/**
 * Get or create the persistent preloaded HTML5 Audio instance
 */
export const getPersistentAudio = () => {
  if (!persistentAudio && typeof window !== 'undefined') {
    try {
      persistentAudio = new Audio('/sounds/new-order-alert.mp3');
      persistentAudio.preload = 'auto';
    } catch (_) {}
  }
  return persistentAudio;
};

/**
 * Synthesize a 3-tone service bell chime using Web Audio API
 * Works instantly with zero latency, no network files required
 */
export const playWebAudioChime = async () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (_) {}
    }

    const now = audioContext.currentTime;

    const playTone = (freq, startOffset, gainPeak = 0.6, duration = 1.0) => {
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
    playTone(587.33, 0.00, 0.5, 0.9);
    playTone(880.00, 0.22, 0.6, 1.1);
    playTone(1174.66, 0.48, 0.7, 1.4);
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
 * Warm up / unlock BOTH the HTML5 Audio element and the Web Audio API on user interaction
 * Guarantees audio playback will succeed when an order arrives even in backgrounded tabs
 */
export const unlockAudio = () => {
  try {
    // 1. Prime persistent HTML5 Audio element on user gesture
    const audio = getPersistentAudio();
    if (audio && !isAudioPrimed) {
      audio.volume = 0.001; // virtually inaudible for prime
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1.0;
          isAudioPrimed = true;
        }).catch(() => {});
      }
    }

    // 2. Prime Web Audio API AudioContext on user gesture
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!audioContext) {
        audioContext = new AudioCtx();
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      // Play a 1-sample buffer note to firmly activate the hardware audio pipeline
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
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
export const playOrderNotificationSound = async (force = false) => {
  if (!force && !isSoundAlertEnabled()) {
    return;
  }

  let played = false;

  // 1. Try persistent pre-unlocked HTML5 Audio first
  const audio = getPersistentAudio();
  if (audio) {
    try {
      audio.currentTime = 0;
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        played = true;
      }
    } catch (e) {
      console.warn('[SoundAlerts] HTML5 audio blocked or failed, using synthesized chime fallback:', e.message);
    }
  }

  // 2. If HTML5 Audio was blocked or failed, trigger synthesized Web Audio bell chime
  if (!played) {
    await playWebAudioChime();
  }
};

