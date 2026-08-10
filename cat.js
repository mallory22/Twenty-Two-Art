document.addEventListener('DOMContentLoaded', () => {
  const cat = document.getElementById('lotus-cat');
  if (!cat) return;

  const isAudioEnabled = () => {
    if (window.__siteAudio && typeof window.__siteAudio.isEnabled === 'function') {
      return window.__siteAudio.isEnabled();
    }

    try {
      const v = localStorage.getItem('audio-on');
      if (v === null) return true; // Default to audio-on for first-time visitors
      return v === 'true';
    } catch {
      return true;
    }
  };

  // Create audio element
  const audio = document.createElement('audio');
  audio.id = 'cat-meow';
  audio.src = 'sounds/meow.mp3';
  audio.preload = 'auto';
  document.body.appendChild(audio);

  const originalSrc = 'assets/lotus.png';
  const meowSrc = 'assets/lotusmeow.png';

  // Ensure pointer style if CSS didn't load
  cat.style.cursor = 'pointer';

  cat.addEventListener('click', () => {
    if (!isAudioEnabled()) return;

    // Try to reset audio to start if already playing
    try { if (!audio.paused) audio.currentTime = 0; } catch (e) {}

    // Swap image source only — let CSS control size & position so both images match
    cat.setAttribute('src', meowSrc);

    audio.play().catch(() => {
      // play may fail if file is missing or autoplay is blocked; still show image briefly
    });

    // Revert when audio ends, or after a short timeout as a fallback
    const revert = () => { cat.setAttribute('src', originalSrc); };

    audio.addEventListener('ended', revert, { once: true });

    // Fallback timeout to ensure image goes back even if audio isn't available
    setTimeout(() => { if (cat.getAttribute('src') !== originalSrc) revert(); }, 900);
  });
});