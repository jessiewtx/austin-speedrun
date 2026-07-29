// Shared logo: the Austin Speedrun orbital + lightning-bolt mark (no glow in nav/footer).
window.ASR_LOGO = function(size){
  size = size || 30;
  return `<img class="asr-mark" src="assets/brand/speedrun-mark.svg" alt="Austin Speedrun" style="height:${size}px;width:auto;display:block">`;
};
window.ASR_WORDMARK = function(size){
  size = size || 28;
  return `<a class="asr-logo" href="index.html" aria-label="GT School — Austin Speedrun"><img class="gt-mark" src="assets/brand/gt-icon-white.png" alt="" style="height:${size}px;width:auto;display:block"><span class="gt-word">GT School</span><span class="asr-div" aria-hidden="true"></span><span class="asr-word">AUSTIN<span class="asr-word-accent">SPEEDRUN</span></span></a>`;
};
// Text-only wordmark (no mark icon), used in the footer.
window.ASR_WORDMARK_TEXT = function(){
  return `<a class="asr-logo" href="index.html" aria-label="Austin Speedrun home"><span class="asr-word">AUSTIN<span class="asr-word-accent">SPEEDRUN</span></span></a>`;
};
