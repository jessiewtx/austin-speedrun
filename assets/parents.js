document.getElementById('logo').innerHTML = window.ASR_WORDMARK(28);
document.getElementById('logoFoot').innerHTML = window.ASR_WORDMARK(24);

// zip digit-only filter
const zipIn = document.getElementById('in-zip');
zipIn.addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,5)});

const form = document.getElementById('waitForm');
function setErr(id, bad){ document.getElementById(id).classList.toggle('invalid', bad); }

form.addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('in-name').value.trim();
  const email = document.getElementById('in-email').value.trim();
  const zip = document.getElementById('in-zip').value.trim();
  const grade = document.getElementById('in-grade').value;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const zipOk = /^\d{5}$/.test(zip);
  let ok = true;
  if(!name){setErr('f-name',true);ok=false} else setErr('f-name',false);
  if(!emailOk){setErr('f-email',true);ok=false} else setErr('f-email',false);
  if(!zipOk){setErr('f-zip',true);ok=false} else setErr('f-zip',false);
  if(!grade){setErr('f-grade',true);ok=false} else setErr('f-grade',false);
  if(!ok) return;

  // demo-only: hold in memory, no backend
  window.__asrWaitlist = window.__asrWaitlist || [];
  window.__asrWaitlist.push({name,email,zip,grade,ts:Date.now()});

  const first = name.split(' ')[0];
  document.getElementById('formCard').innerHTML = `
    <div class="form-success">
      <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3>You're on the list, ${first}!</h3>
      <p>We'll email you the moment registration opens on <b>August 3</b> for ${zip}. Watch for details on your child's proctored baseline and how to unlock more prizes for your zip.</p>
      <div class="ss-detail">SAVED (demo): ${zip} · ${grade} · we'll reach you at ${email}</div>
    </div>`;
  document.getElementById('formCard').scrollIntoView({behavior:'smooth',block:'center'});
});
