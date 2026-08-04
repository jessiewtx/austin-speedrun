/* Austin Speedrun chat launcher - the one new file the marketing site needs.
 *
 * WHERE THIS BELONGS: their repo, as `assets/gtbot.js`, deployed by their own `deploy.sh`
 * beside `logo.js` and `zipdata.js`. It is kept here so we own it, test it and hand them a file
 * rather than a patch, and it is served at /static/gtbot.js for our local harness ONLY. Their
 * production page must NOT <script src> it from our origin: that would make their marketing
 * site's render depend on our uptime, and an origin that is slow or down would stall it
 * (PLAN-speedrun-site-embed.md, section 5). The only thing their page ever loads from us is the
 * iframe, and only after a deliberate click.
 *
 * The split is the recommendation in section 5: the launcher is theirs, plain markup on their
 * page so it renders instantly and they can restyle it; the conversation is an iframe pointing
 * at our /embed, so their stylesheet swap and their DOM never meet ours, and the POST inside the
 * frame is same-origin - no CORS middleware, no preflight, no http-vs-https allowlist footgun.
 *
 * NO MICROPHONE, AND THAT IS NOT A PREFERENCE. Their site is served over plain HTTP from an S3
 * website endpoint. The W3C secure-context check walks the entire ancestor chain, so an HTTPS
 * iframe inside an HTTP page is NOT a secure context and `navigator.mediaDevices` is undefined
 * inside it. Push-to-talk cannot work on this site by any arrangement of iframes (sections 2 and
 * 10). Do not add a mic here or in the panel until the site itself is HTTPS.
 *
 * ASCII only, on purpose: a .js file served without a charset is decoded as the host document's
 * encoding, and we do not control their headers.
 *
 * THE ASSISTANT'S NAME IS SPELLED OUT HERE, AND THIS IS THE ONLY FILE OUTSIDE `identity.py` THAT
 * MAY DO IT. Every other surface has the name substituted in on the way out, by
 * `api._render_template`. This file cannot: their `deploy.sh` serves it and our server never
 * renders it. Generating it from a template at build time would not help either, because what
 * they deploy is a byte copy taken at vendoring time whichever way this file is produced. So the
 * name is a literal, and two checks stand behind it: `tests/unit/test_identity.py` fails if the
 * strings below stop matching `ASSISTANT_NAME`, and `scripts/check_vendored_launcher.py` fails if
 * their vendored `assets/gtbot.js` stops matching this file.
 *
 * Usage, immediately before </body>. The host is the deployed App Runner service, and it must
 * match the `data-bot-url` in their page - this example is the thing a reviewer copies:
 *   <script src="assets/gtbot.js"
 *           data-bot-url="https://tuxwtz8rqi.us-east-1.awsapprunner.com"
 *           data-audience="parent"></script>
 */
(function () {
  'use strict';

  var tag = document.currentScript;
  if (!tag || window.__gtbotLauncher) return;
  window.__gtbotLauncher = true;

  var BOT = (tag.getAttribute('data-bot-url') || '').replace(/\/+$/, '');
  /* A GREETING HINT AND NOTHING ELSE. It picks the opening line, client-side, inside the panel.
     It must never be allowed to set `Session.audience`: the audience gate exists because that
     answer has to come from the person, and a query string is forgeable by anyone with a URL bar
     (sections 6 and 11). The panel reads it from its own location and never posts it. */
  var AUDIENCE = tag.getAttribute('data-audience') || '';
  var KEY = 'asr_gtbot_session';
  var WAKE_MS = 6000;   // by now, say out loud that it is slow rather than spin in silence
  /* Generous on purpose, and no longer a cold-start allowance. App Runner holds a provisioned
     instance (MinSize 1), so there is no container to boot the way a spun-down Render one was;
     what it does instead is CPU-THROTTLE an idle instance, so the first request after a quiet
     spell is slow rather than absent. This is headroom for that plus the model gateway behind it,
     and past it the panel is genuinely broken rather than late. */
  var FAIL_MS = 45000;
  var GRACE_MS = 3000;  // the document arrived - how long its script gets to say hello

  if (!BOT) {
    if (window.console) window.console.error('gtbot.js: missing data-bot-url on the script tag');
    return;  // better no button at all than a button that opens an empty rectangle
  }
  var ORIGIN = '';
  try { ORIGIN = new URL(BOT, window.location.href).origin; } catch (e) { ORIGIN = ''; }

  /* Top-frame storage on purpose. An iframe's own localStorage is third-party: partitioned in
     Chrome and Firefox, and on Safari subject to ITP behaviour that ranges from partitioned to
     ephemeral. Minting the id up here makes it first-party to their site, so the same server-side
     session is found after index.html -> parents.html. Get this wrong and the widget works
     everywhere except iPhone (section 4). */
  var sid = null;
  try { sid = window.localStorage.getItem(KEY); } catch (e) { /* Safari private mode */ }
  if (!sid) {
    /* crypto.randomUUID needs a secure context and this page is http://, so it is absent here.
       Do not "simplify" this away: on localhost it never fires, so it breaks only in production. */
    sid = (window.crypto && window.crypto.randomUUID)
      ? 'asr-' + window.crypto.randomUUID()
      : 'asr-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    try { window.localStorage.setItem(KEY, sid); } catch (e) { /* nothing to do but carry on */ }
  }

  /* Every selector below is .gtb-prefixed and every inherited property the button cares about is
     declared outright, so neither page can reach into the other: their `button {}` rules lose to
     a class, and nothing here matches an element of theirs. */
  var style = document.createElement('style');
  style.textContent = `
.gtb-launch{position:fixed;right:24px;bottom:24px;z-index:99999;width:60px;height:60px;
margin:0;padding:0;border:0;border-radius:50%;background:#002a3a;color:#fbfbfb;cursor:pointer;
display:grid;place-items:center;line-height:1;-webkit-appearance:none;appearance:none;
box-shadow:inset 0 0 0 1px rgba(228,139,83,.55),0 14px 34px -10px rgba(0,42,58,.6);
transition:background .16s ease,transform .2s ease,box-shadow .2s ease}
.gtb-launch:hover{background:#001117;transform:translateY(-2px);
box-shadow:inset 0 0 0 1px rgba(228,139,83,.85),0 18px 40px -10px rgba(0,42,58,.65)}
.gtb-launch:active{transform:translateY(0)}
/* Two-tone ring, because we do not know what colour their page puts behind it: Near White reads
   on the Navy button (14.6) and Navy reads on their Off White page (13.9). */
.gtb-launch:focus-visible{outline:2px solid #fbfbfb;outline-offset:-5px;
box-shadow:0 0 0 3px #002a3a,0 14px 34px -10px rgba(0,42,58,.6)}
.gtb-launch svg{display:block;width:26px;height:26px}
.gtb-launch .gtb-x{display:none}
.gtb-launch[aria-expanded="true"] .gtb-bubble{display:none}
.gtb-launch[aria-expanded="true"] .gtb-x{display:block}
.gtb-frame,.gtb-shell{position:fixed;right:24px;bottom:96px;z-index:99999;width:380px;height:560px;
max-height:calc(100vh - 140px);border:0;border-radius:12px;display:none;
box-shadow:0 24px 60px -20px rgba(0,42,58,.45)}
.gtb-frame{background:transparent}
.gtb-frame.gtb-on{display:block}
.gtb-shell{flex-direction:column;justify-content:center;gap:8px;padding:26px 24px;
background:#fcf4ef;border:1px solid #ecd9cb;color:#001117;text-align:left;
font-family:'General Sans','Inter Tight','Segoe UI',system-ui,sans-serif}
.gtb-shell.gtb-on{display:flex}
.gtb-shell b{font-size:15px;font-weight:620;letter-spacing:-.008em}
.gtb-shell span{font-size:13.5px;line-height:1.5;color:#33505c}
.gtb-shell button{display:none;align-self:flex-start;margin-top:8px;padding:9px 14px;
font-family:'JetBrains Mono','Inconsolata',ui-monospace,Consolas,monospace;font-size:11.5px;
font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#fbfbfb;background:#002a3a;
border:0;border-radius:8px;cursor:pointer}
.gtb-shell.gtb-failed button{display:inline-block}
.gtb-shell button:hover{background:#001117}
.gtb-shell button:focus-visible{outline:2px solid #004f71;outline-offset:2px}
/* Full-bleed on a phone. The height is stated rather than left to top+bottom, because an iframe
   is a replaced element: height:auto gives it its intrinsic 150px and the panel collapses to a
   strip. dvh second so it wins where supported - 100vh on mobile Safari counts the URL bar. */
@media (max-width:560px){
.gtb-launch{right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px))}
.gtb-frame,.gtb-shell{right:12px;left:12px;width:auto;max-height:none;
bottom:calc(88px + env(safe-area-inset-bottom,0px));
height:calc(100vh - 100px - env(safe-area-inset-bottom,0px));
height:calc(100dvh - 100px - env(safe-area-inset-bottom,0px))}}
@media (prefers-reduced-motion:reduce){
.gtb-launch{transition:none}.gtb-launch:hover{transform:none}}`;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gtb-launch';
  /* Both SVGs are aria-hidden, so this string is the entire button to a screen reader and has to
     carry what the speech bubble carries for everyone else - that this opens a chat - on top of
     the name. "chat assistant" is what the panel already calls its own region, and it is what
     keeps "Ask Scout" from reading like a button that messages a person. An opening label is an
     introduction, not the disclosure: `BOT_DISCLOSURE` is the sentence that has to leave no room,
     and it stays separate. */
  btn.setAttribute('aria-label', 'Ask Scout, the Austin Speedrun chat assistant');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML =
    '<svg class="gtb-bubble" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 3.2c-5 0-9 3.4-9 7.6 0 2 .9 3.9 2.4 5.2-.1 1.2-.6 2.3-1.4 3.2-.3.3 0 .8.4.7 ' +
    '1.8-.2 3.4-.8 4.7-1.8.9.2 1.9.3 2.9.3 5 0 9-3.4 9-7.8s-4-7.6-9-7.6z"/></svg>' +
    '<svg class="gtb-x" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" ' +
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>';

  /* The panel cannot draw its own "waking up" state, because on a cold start the wait happens
     before its document exists. So the host page owns it (section 8), and it doubles as the
     failure surface: an unreachable bot must read as an explained problem with a way out, not as
     a blank white rectangle. */
  var shell = document.createElement('div');
  shell.className = 'gtb-shell';
  shell.setAttribute('role', 'status');
  shell.setAttribute('aria-live', 'polite');
  var shellTitle = document.createElement('b');
  var shellBody = document.createElement('span');
  var retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Try again';
  shell.appendChild(shellTitle);
  shell.appendChild(shellBody);
  shell.appendChild(retry);

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(shell);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  var frame = null;
  var isOpen = false;
  var isReady = false;
  var wakeTimer = null;
  var failTimer = null;

  function stopTimers() {
    window.clearTimeout(wakeTimer);
    window.clearTimeout(failTimer);
  }

  function say(title, body, failed) {
    shellTitle.textContent = title;
    shellBody.textContent = body;
    shell.className = 'gtb-shell gtb-on' + (failed ? ' gtb-failed' : '');
  }

  function fail() {
    stopTimers();
    if (frame) frame.classList.remove('gtb-on');
    if (isOpen) {
      say('The assistant is not reachable',
          'We could not reach it just now. Everything else on this page still works.', true);
    }
  }

  function build() {
    /* No loading="lazy". The frame is created hidden behind the shell, and a display:none element
       never intersects the viewport, so a lazy frame would sit there forever without fetching.
       Laziness is already bought by building on first click rather than on page load. */
    frame = document.createElement('iframe');
    frame.className = 'gtb-frame';
    frame.id = 'gtb-panel';
    frame.title = 'Scout, the Austin Speedrun chat assistant';
    /* allow-same-origin keeps the panel same-origin to ITSELF, which is what makes its POST and
       its sessionStorage work; what the sandbox removes is the panel's ability to navigate their
       page out from under a visitor. */
    frame.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox'
    );
    frame.src = BOT + '/embed?sid=' + encodeURIComponent(sid) +
                (AUDIENCE ? '&audience=' + encodeURIComponent(AUDIENCE) : '');
    /* A 404 body fires `load` too, so `load` cannot mean "the panel is up". The panel says that
       itself with a postMessage; this only shortens the wait once its document has arrived. */
    frame.addEventListener('load', function () {
      if (isReady) return;
      window.clearTimeout(failTimer);
      failTimer = window.setTimeout(fail, GRACE_MS);
    });
    frame.addEventListener('error', fail);
    document.body.appendChild(frame);
    btn.setAttribute('aria-controls', frame.id);

    isReady = false;
    say('Connecting', 'Opening the Austin Speedrun assistant.', false);
    wakeTimer = window.setTimeout(function () {
      if (!isReady) {
        /* Says that it is slow, not WHY, and deliberately promises no duration. The old copy
           ("sleeps when nobody is using it... up to a minute") described Render's free tier
           spinning a container down to nothing. App Runner keeps the instance and throttles its
           CPU instead, so nothing sleeps and a minute is not the shape of the wait - this was
           user-facing text asserting an implementation detail that had stopped being true. */
        say('Still connecting',
            'The first message after a quiet spell can take a few seconds. Hang tight.', false);
      }
    }, WAKE_MS);
    failTimer = window.setTimeout(fail, FAIL_MS);
  }

  function setOpen(next) {
    isOpen = next;
    btn.setAttribute('aria-expanded', next ? 'true' : 'false');
    if (!next) {
      if (frame) frame.classList.remove('gtb-on');
      shell.classList.remove('gtb-on');
      btn.focus();
      return;
    }
    if (!frame) build();
    else if (isReady) show();
    else shell.classList.add('gtb-on');
  }

  function show() {
    frame.classList.add('gtb-on');
    frame.focus();
    /* The panel put focus in its composer at load time, when it was still display:none and focus
       could not stick. Telling it that it is on screen is the only moment it can do that. */
    if (frame.contentWindow) {
      frame.contentWindow.postMessage({ gtbot: 1, type: 'shown' }, ORIGIN || '*');
    }
  }

  window.addEventListener('message', function (e) {
    if (!frame || e.source !== frame.contentWindow) return;
    if (ORIGIN && e.origin !== ORIGIN) return;
    var msg = e.data;
    if (!msg || msg.gtbot !== 1) return;
    if (msg.type === 'ready') {
      isReady = true;
      stopTimers();
      shell.classList.remove('gtb-on');
      if (isOpen) show();
    } else if (msg.type === 'close') {
      setOpen(false);
    }
  });

  btn.addEventListener('click', function () { setOpen(!isOpen); });
  retry.addEventListener('click', function () {
    stopTimers();
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    frame = null;
    build();
  });
  /* Escape pressed while focus is inside the panel never reaches this document - that keydown
     belongs to the frame. The panel handles its own and posts `close` back, above. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) setOpen(false);
  });
})();
