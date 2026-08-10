const themeStorageKey = 'selected-theme';
const audioStorageKey = 'audio-on';
const themeBtn = document.getElementById('theme-toggle');
const themeImg = document.getElementById('theme-img'); // optional image element for icon swap
const audioBtn = document.getElementById('audio-toggle');
const audioImg = audioBtn ? audioBtn.querySelector('img') : null;

// --- Audio assets ---
// Preload short UI sounds used across the site
const sounds = {
  button: new Audio('sounds/button.mp3'),
  lightMode: new Audio('sounds/lightmode.mp3'),
  darkMode: new Audio('sounds/darkmode.mp3'),
  audioOn: new Audio('sounds/audioon.mp3'),
};
// Set default volumes and preload. Make the button sound a bit louder so clicks are more audible.
Object.values(sounds).forEach(a => { a.preload = 'auto'; a.volume = 0.85; });
if (sounds.button) sounds.button.volume = 1.0;

const applyTheme = (useLightMode) => {
  document.body.classList.toggle('light-mode', useLightMode);
};

const getStoredTheme = () => {
  try {
    return localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
};

const setStoredTheme = (theme) => {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // ignore storage failures
  }
};

const getStoredAudio = () => {
  try {
    return localStorage.getItem(audioStorageKey) === 'true';
  } catch {
    return false;
  }
};

const setStoredAudio = (isOn) => {
  try {
    localStorage.setItem(audioStorageKey, isOn ? 'true' : 'false');
  } catch {
    // ignore storage failures
  }
};

const getAudioImageSrc = (isOn, isLightMode) => {
  if (isLightMode) return isOn ? 'assets/audioon.png' : 'assets/audiooff.png';
  return isOn ? 'assets/darkaudioon.png' : 'assets/darkaudiooff.png';
};

// Initialize theme
const storedTheme = getStoredTheme();
const initialLightMode = storedTheme === 'light';
applyTheme(initialLightMode);

// Initialize audio state
let isAudioOn = getStoredAudio();

// Helper to play a sound only when audio is enabled
const playIfAudioOn = (audioObj) => {
  if (!isAudioOn || !audioObj) return;
  try {
    audioObj.currentTime = 0;
    // play() returns a promise; ignore rejections (browsers may block autoplay until user gesture)
    audioObj.play().catch(() => {});
  } catch (e) {
    // ignore
  }
};

window.__siteAudio = {
  isEnabled: () => isAudioOn,
  playIfAudioOn,
};

// Update the theme toggle icon (shows the opposite mode as the toggle target)
if (themeImg) {
  themeImg.src = document.body.classList.contains('light-mode') ? 'assets/darkmode.png' : 'assets/lightmode.png';
}

// Helper to update audio image based on current theme and audio state
const updateAudioIcon = () => {
  if (!audioImg) return;
  const isLight = document.body.classList.contains('light-mode');
  audioImg.src = getAudioImageSrc(isAudioOn, isLight);
  audioImg.alt = isAudioOn ? 'Audio On' : 'Audio Off';
};

// Ensure audio button reflects stored state on load
updateAudioIcon();

// Theme toggle behavior
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const wasLight = document.body.classList.contains('light-mode');
    const newLightMode = !wasLight;
    applyTheme(newLightMode);
    setStoredTheme(newLightMode ? 'light' : 'dark');

    // Swap the theme image file if present
    if (themeImg) {
      themeImg.src = document.body.classList.contains('light-mode') ? 'assets/darkmode.png' : 'assets/lightmode.png';
    }

    // Play themed sound when switching modes
    if (newLightMode) playIfAudioOn(sounds.lightMode);
    else playIfAudioOn(sounds.darkMode);

    // Update audio icon to the correct themed variant while preserving on/off state
    updateAudioIcon();
  });
}

// Audio toggle behavior: switch on/off image when clicked, and persist state
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    isAudioOn = !isAudioOn;
    setStoredAudio(isAudioOn);
    updateAudioIcon();

    // Play the "audio turned on" sound only when enabling audio
    if (isAudioOn) {
      playIfAudioOn(sounds.audioOn);
    }

    // Optional: here is where audio playback could be started/stopped if an <audio> element exists
    // const audioEl = document.querySelector('audio#background-music');
    // if (audioEl) { isAudioOn ? audioEl.play() : audioEl.pause(); }
  });
}

// Generic UI: play button sound for most interactions (nav links, portfolio images, icon buttons)
const attachUiClickSounds = () => {
  // Helper to mark element so we don't attach multiple listeners
  const markAttached = (el) => { if (el) el.dataset.soundAttached = 'true'; };
  const alreadyAttached = (el) => el && el.dataset && el.dataset.soundAttached === 'true';

  // nav links (specific class)
  document.querySelectorAll('.nav-btn').forEach(el => {
    if (alreadyAttached(el)) return;
    el.addEventListener('click', (e) => {
      playIfAudioOn(sounds.button);
    });
    markAttached(el);
  });

  // portfolio and commissions images (page-specific listeners also handle expansion, but this ensures a sound is played)
  document.querySelectorAll('.portfolio-grid img, .portfolio-grid picture img, .example-img').forEach(el => {
    if (alreadyAttached(el)) return;
    el.addEventListener('click', () => playIfAudioOn(sounds.button));
    markAttached(el);
  });

  // general icon buttons except the two special toggles (theme/audio) which have their own sounds
  document.querySelectorAll('.icon-btn').forEach(el => {
    if (el === themeBtn || el === audioBtn) return;
    if (alreadyAttached(el)) return;
    el.addEventListener('click', () => playIfAudioOn(sounds.button));
    markAttached(el);
  });

  // Also attach to anchor links that navigate to pages (internal links).
  document.querySelectorAll('a[href]').forEach(el => {
    if (alreadyAttached(el)) return;
    const href = el.getAttribute('href');
    if (!href) return;
    // ignore mailto/tel and fragment-only links
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
    try {
      const url = new URL(href, location.href);
      // only attach for same-origin (internal) links
      if (url.origin !== location.origin) return;
    } catch (e) {
      // if URL parsing fails, skip attaching
      return;
    }

    // Intercept ordinary left-clicks (no modifier keys) to play sound before navigating.
    el.addEventListener('click', (event) => {
      // Allow default for middle-clicks, modifiers, targets that open new tabs/windows, or downloads
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (el.target === '_blank' || el.hasAttribute('download')) return;

      // If audio is disabled or there is no button sound, let navigation proceed immediately
      if (!isAudioOn || !sounds.button) return;

      // Prevent immediate navigation and play the sound, navigating when it finishes or on timeout
      event.preventDefault();

      const audioObj = sounds.button;
      // Reset playback to start
      try { audioObj.currentTime = 0; } catch (e) {}

      // Cleanup helper to navigate once
      const navigateNow = () => {
        // Use location.assign so history behaves like a normal link click
        window.location.assign(href);
      };

      // If duration is available, use it to set a conservative timeout fallback
      const fallbackTimeoutMs = Math.max(300, (audioObj.duration && !isNaN(audioObj.duration) ? Math.ceil(audioObj.duration * 1000) + 50 : 500));

      let settled = false;
      const settleAndNavigate = () => { if (settled) return; settled = true; navigateNow(); };

      // Try to play; if play starts, wait for 'ended' event. If play is blocked/rejected, navigate immediately.
      try {
        const p = audioObj.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            // Playback started — wait for ended event or timeout
            const onEnded = () => { audioObj.removeEventListener('ended', onEnded); clearTimeout(timeoutId); settleAndNavigate(); };
            audioObj.addEventListener('ended', onEnded);
            const timeoutId = setTimeout(() => { audioObj.removeEventListener('ended', onEnded); settleAndNavigate(); }, fallbackTimeoutMs);
          }).catch(() => {
            // Playback failed (autoplay or other) — navigate immediately
            settleAndNavigate();
          });
        } else {
          // play() didn't return a promise — attach ended handler as best-effort
          const onEnded = () => { audioObj.removeEventListener('ended', onEnded); clearTimeout(timeoutId); settleAndNavigate(); };
          audioObj.addEventListener('ended', onEnded);
          const timeoutId = setTimeout(() => { audioObj.removeEventListener('ended', onEnded); settleAndNavigate(); }, fallbackTimeoutMs);
        }
      } catch (e) {
        // If anything goes wrong, navigate immediately
        settleAndNavigate();
      }
    });

    markAttached(el);
  });
};

// Attach UI sound listeners now (script is loaded at end of body in pages)
attachUiClickSounds();


 // 6. The "22" Click Counter (now with localStorage!)
  const counterBtn = document.getElementById('counter-btn');
  const countDisplay = document.getElementById('click-count');
  
  // 1. CHECK FOR SAVED DATA: 
  // Look inside the browser's memory for something called 'twentyTwoClicks'.
  // If it exists, turn it into a number (parseInt). If it doesn't exist yet, default to 0.
  let currentCount = localStorage.getItem('twentyTwoClicks') ? parseInt(localStorage.getItem('twentyTwoClicks')) : 0;

  // 2. INITIAL DISPLAY:
  // Immediately update the text on the screen so it shows the saved score as soon as the page loads.
  countDisplay.textContent = `22s: ${currentCount}`;

  // 3. BUTTON CLICK EVENT:
  counterBtn.addEventListener('click', () => {
    // Increase the count by 1
    currentCount++;
    
    // Update the text on the screen
    countDisplay.textContent = `22s: ${currentCount}`;
    
    // Save the updated count to localStorage
    localStorage.setItem('twentyTwoClicks', currentCount);
    
    // Play the click sound if audio is toggled on!
    if (isAudioOn) {
      clickSound.currentTime = 0;
      clickSound.play();
    }
  });