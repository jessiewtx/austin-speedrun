// Shared logo: the Austin Speedrun orbital + lightning-bolt mark (no glow in nav/footer).
window.ASR_LOGO = function(size){
  size = size || 30;
  return `<img class="asr-mark" src="assets/brand/speedrun-mark.svg" alt="Austin Speedrun" style="height:${size}px;width:auto;display:block">`;
};
window.ASR_WORDMARK = function(size){
  return `<a class="asr-logo" href="index.html" aria-label="Austin Speedrun by GT School"><img class="asr-mark" src="assets/brand/speedrun-mark.svg" alt="" style="height:34px;width:auto;display:block"><span class="asr-lockup"><span class="asr-word">AUSTIN<span class="asr-word-accent">SPEEDRUN</span></span><span class="asr-by">by GT School</span></span></a>`;
};
// Text-only wordmark (no mark icon), used in the footer.
window.ASR_WORDMARK_TEXT = function(){
  return `<a class="asr-logo" href="index.html" aria-label="Austin Speedrun home"><span class="asr-word">AUSTIN<span class="asr-word-accent">SPEEDRUN</span></span></a>`;
};
