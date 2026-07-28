// Shared inline SVG logo: a forward-motion / speedrun lightning chevron mark.
// Uses currentColor so it works on both dark and light themes.
window.ASR_LOGO = function(size){
  size = size || 30;
  return `<svg class="asr-mark" width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 20 L18 20 M14 12 L26 12 M14 28 L26 28" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity="0.4"/>
    <path d="M23 4 L11 22 L20 22 L17 36 L31 16 L22 16 Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;
};
window.ASR_WORDMARK = function(size){
  return `<a class="asr-logo" href="index.html" aria-label="Austin Speedrun home">${window.ASR_LOGO(size)}<span class="asr-word">AUSTIN<span class="asr-word-accent">SPEEDRUN</span></span></a>`;
};
