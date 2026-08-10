document.addEventListener('DOMContentLoaded', () => {
  const cat = document.getElementById('lotus-cat');
  if (!cat) return;

  const isAudioEnabled = () => {
    if (window.__siteAudio && typeof window.__siteAudio.isEnabled === 'function') {
      return window.__siteAudio.isEnabled();
    }

    try {
      return localStorage.getItem('audio-on') === 'true';
    } catch {
      return false;
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

  // Keep original inline style values so we can restore them
  const originalWidth = cat.style.width || getComputedStyle(cat).width;
  const originalLeft = cat.style.left || getComputedStyle(cat).left;
  const originalBottom = cat.style.bottom || getComputedStyle(cat).bottom;

  // Desired temporary values for the meowing image to make it smaller and aligned
  const meowWidth = '280px';
  const meowLeft = '3px';
  const meowBottom = '-177px';

  // Ensure pointer style if CSS didn't load
  cat.style.cursor = 'pointer';

  cat.addEventListener('click', () => {
    if (!isAudioEnabled()) {
      return;
    }

    // Try to reset audio to start if already playing
    try {
      if (!audio.paused) audio.currentTime = 0;
    } catch (e) {
      // ignore
    }

    // swap to meowing image, adjust size and position, then play sound
    cat.setAttribute('src', meowSrc);
    // apply the temporary smaller size/position for the meow image
    cat.style.width = meowWidth;
    cat.style.left = meowLeft;
    cat.style.bottom = meowBottom;

    audio.play().catch(() => {
      // play may fail if file is missing or autoplay is blocked; still show image briefly
    });

    // Revert when audio ends, or after a short timeout as a fallback
    const revert = () => {
      cat.setAttribute('src', originalSrc);
      // restore original inline style values
      cat.style.width = originalWidth;
      cat.style.left = originalLeft;
      cat.style.bottom = originalBottom;
    };

    audio.addEventListener('ended', revert, { once: true });

    // Fallback timeout to ensure image goes back even if audio isn't available
    setTimeout(() => {
      if (cat.getAttribute('src') !== originalSrc) revert();
    }, 900);
  });
});