document.getElementById('logo').innerHTML = window.ASR_WORDMARK(28);
document.getElementById('logoFoot').innerHTML = window.ASR_WORDMARK(24);

/* ============================================================
   WAITLIST DESTINATION  —  paste your endpoint URL on ONE line below.

   RECOMMENDED: a Google Sheet (free, unlimited, and the sheet is
   yours to share / hand off to any account = your dashboard).
     1) Make a sheet at  sheets.new
     2) Extensions ▸ Apps Script, paste the script provided, Save
     3) Deploy ▸ New deployment ▸ Web app
          · Execute as: Me      · Who has access: Anyone
        Authorize when prompted, then copy the Web app URL (/exec).
     4) Paste that URL below.
   Each signup appends a row: Timestamp, Name, Email, ZIP, Grade.

   Prefer a hosted dashboard instead? Paste a Formspree form URL
   ("https://formspree.io/f/XXXXXXXX") — the code auto-detects it.
   ============================================================ */
const WAITLIST_ENDPOINT   = "https://script.google.com/a/macros/alphaaiengineering.com/s/AKfycbwOIMSXAssjYSZHRSag2lmCXKRQdi7dAxLgVuLOfPGaug7VnTm_gpwx_jpLPOUp_kDu/exec";
const WAITLIST_CONFIGURED = /^https?:\/\//.test(WAITLIST_ENDPOINT);

// zip digit-only filter
const zipIn = document.getElementById('in-zip');
zipIn.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g,'').slice(0,5); });

const form = document.getElementById('waitForm');
function setErr(id, bad){ document.getElementById(id).classList.toggle('invalid', bad); }

form.addEventListener('submit', async function(e){
  e.preventDefault();

  // spam honeypot: real people never fill this hidden field
  const hp = document.getElementById('in-company');
  if (hp && hp.value.trim()) return;

  const name  = document.getElementById('in-name').value.trim();
  const email = document.getElementById('in-email').value.trim();
  const zip   = document.getElementById('in-zip').value.trim();
  const grade = document.getElementById('in-grade').value;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const zipOk   = /^\d{5}$/.test(zip);
  let ok = true;
  if(!name){setErr('f-name',true);ok=false} else setErr('f-name',false);
  if(!emailOk){setErr('f-email',true);ok=false} else setErr('f-email',false);
  if(!zipOk){setErr('f-zip',true);ok=false} else setErr('f-zip',false);
  if(!grade){setErr('f-grade',true);ok=false} else setErr('f-grade',false);
  if(!ok) return;

  const btn = form.querySelector('.form-submit');
  const errBox = document.getElementById('form-error');
  if (errBox) errBox.style.display = 'none';
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Adding you…';

  const payload = {
    name, email, zip, grade,
    _subject: `New Austin Speedrun waitlist: ${name} (ZIP ${zip}, ${grade})`,
    _template: 'table',
    _captcha: 'false'
  };

  // local backup so a submission is never lost, even if the network fails
  try {
    const arr = JSON.parse(localStorage.getItem('asrWaitlist') || '[]');
    arr.push({ name, email, zip, grade, ts: Date.now() });
    localStorage.setItem('asrWaitlist', JSON.stringify(arr));
  } catch(_) {}

  let saved = false;
  if (WAITLIST_CONFIGURED) {
    const isSheet = WAITLIST_ENDPOINT.includes('script.google.com');
    try {
      if (isSheet) {
        // Google Apps Script: text/plain + no-cors sidesteps the CORS preflight
        // it can't answer. The response is opaque, so a resolved fetch = written;
        // a real network failure rejects and is caught below.
        await fetch(WAITLIST_ENDPOINT, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        saved = true;
      } else {
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        saved = res.ok;
      }
    } catch(_) { saved = false; }
  }

  btn.disabled = false; btn.textContent = label;

  // configured but the send failed → let them retry, don't fake success
  if (WAITLIST_CONFIGURED && !saved) {
    if (errBox) errBox.style.display = 'block';
    return;
  }

  const first = name.split(' ')[0];
  document.getElementById('formCard').innerHTML = `
    <div class="form-success">
      <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3>You're on the list, ${first}!</h3>
      <p>We'll email you the moment registration opens on <b>August 3</b> for ${zip}. Watch for details on your child's proctored baseline and how to unlock more prizes for your zip.</p>
      <div class="ss-detail">${WAITLIST_CONFIGURED ? 'Saved' : 'Recorded (demo)'} · ${zip} · ${grade} · we'll reach you at ${email}</div>
    </div>`;
  document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
