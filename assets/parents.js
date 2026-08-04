/* ============================================================
   Austin Speedrun registration.
   Posts to Formspree, then branches the on-screen next step on
   the child's age (from DOB):
     under 13  -> a parent must sign COPPA consent forms first
     13+       -> straight to TimeBack account setup
   The submission carries a coppa_required flag so the backend
   can send the matching automated email. (Actual emails are a
   backend/ops job; this captures the flag + shows the right
   confirmation.)
   ============================================================ */
const REG_ENDPOINT   = "https://formspree.io/f/xvzelnlk";
const REG_CONFIGURED = /^https?:\/\//.test(REG_ENDPOINT);

const studentsEl = document.getElementById('students');
const regForm    = document.getElementById('regForm');
const zipInput   = document.getElementById('in-zip');
let kidSeq = 0;

function kidBlock(n){
  return `<div class="kid-block" data-k="${n}">
    <div class="kid-head"><span>Child ${n}</span><button type="button" class="rm-kid">Remove</button></div>
    <div class="field kf-name"><label>Child's full legal name</label><input class="k-name" type="text"><span class="err">Enter the child's legal name.</span></div>
    <div class="form-row">
      <div class="field kf-dob"><label>Date of birth</label><input class="k-dob" type="date"><span class="err">Enter a valid date of birth.</span></div>
      <div class="field kf-grade"><label>Grade (2026&#8211;27)</label><select class="k-grade"><option value="">Select&#8230;</option><option>6th</option><option>7th</option><option>8th</option></select><span class="err">Select a grade.</span></div>
    </div>
    <div class="form-row">
      <div class="field kf-school"><label>School name</label><input class="k-school" type="text"><span class="err">Enter the school.</span></div>
      <div class="field kf-stype"><label>School type</label><select class="k-stype"><option value="">Select&#8230;</option><option>Public</option><option>Private</option><option>Charter</option><option>Microschool</option><option>Homeschool</option></select><span class="err">Select a type.</span></div>
    </div>
    <div class="field kf-email"><label>Student's email <span class="opt">(optional, 13+ only)</span></label><input class="k-email" type="email"><span class="err">Student email is for ages 13+ &#8212; or enter a valid address.</span></div>
    <div class="field"><label>Accommodations (IEP/504), if any <span class="opt">(optional)</span></label><input class="k-accom" type="text"></div>
    <label class="ck"><input type="checkbox" class="k-device"><span>We have a device + reliable internet at home</span></label>
  </div>`;
}
function refreshKids(){
  const blocks = studentsEl.querySelectorAll('.kid-block');
  blocks.forEach((b,i)=>{
    b.querySelector('.kid-head span').textContent = 'Child ' + (i+1);
    const rm = b.querySelector('.rm-kid'); if(rm) rm.style.display = blocks.length>1 ? '' : 'none';
  });
}
function addKid(){ kidSeq++; studentsEl.insertAdjacentHTML('beforeend', kidBlock(kidSeq)); refreshKids(); }
studentsEl.addEventListener('click', e=>{ const rm=e.target.closest('.rm-kid'); if(rm){ rm.closest('.kid-block').remove(); refreshKids(); } });
document.getElementById('addKid').addEventListener('click', addKid);
addKid(); // start with one child

zipInput.addEventListener('input', e=>{ e.target.value = e.target.value.replace(/\D/g,'').slice(0,5); });

function val(id){ const el=document.getElementById(id); return el ? el.value.trim() : ''; }
function mark(id,bad){ const el=document.getElementById(id); if(el) el.classList.toggle('invalid',!!bad); }
function markEl(el,bad){ if(el) el.classList.toggle('invalid',!!bad); }
function ageOf(dobStr){
  const d=new Date(dobStr); if(!dobStr || isNaN(d.getTime())) return null;
  const t=new Date(); let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth(); if(m<0||(m===0&&t.getDate()<d.getDate())) a--;
  return a;
}

regForm.addEventListener('submit', async function(e){
  e.preventDefault();
  const hp=document.getElementById('in-company'); if(hp && hp.value.trim()) return;

  let ok=true;
  const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const zipData=window.ZIP_DATA||null;

  const pname=val('in-pname'), phone=val('in-phone'), email=val('in-email');
  const street=val('in-street'), unit=val('in-unit'), city=val('in-city'), state=val('in-state'), zip=val('in-zip');
  const heard=val('in-heard'), sign=val('in-sign');

  const need=(id,good)=>{ mark(id,!good); if(!good) ok=false; };
  need('f-pname', !!pname);
  need('f-phone', phone.replace(/\D/g,'').length>=7);
  need('f-email', emailRe.test(email));
  need('f-street', !!street);
  need('f-city', !!city);
  need('f-state', !!state);

  const zip5=/^\d{5}$/.test(zip);
  const inMetro = zip5 && !!zipData && Object.prototype.hasOwnProperty.call(zipData, zip);
  const zipErr=document.querySelector('#f-zip .err');
  if(!zip5){ if(zipErr) zipErr.textContent='Enter a 5-digit ZIP.'; mark('f-zip',true); ok=false; }
  else if(!inMetro){ if(zipErr) zipErr.textContent="That ZIP isn't in the 5-county Austin metro (Travis, Williamson, Hays, Bastrop, Caldwell)."; mark('f-zip',true); ok=false; }
  else mark('f-zip',false);

  const kids=[]; let anyUnder13=false;
  studentsEl.querySelectorAll('.kid-block').forEach(b=>{
    const name=b.querySelector('.k-name').value.trim();
    const dob=b.querySelector('.k-dob').value;
    const grade=b.querySelector('.k-grade').value;
    const school=b.querySelector('.k-school').value.trim();
    const stype=b.querySelector('.k-stype').value;
    const semail=b.querySelector('.k-email').value.trim();
    const accom=b.querySelector('.k-accom').value.trim();
    const device=b.querySelector('.k-device').checked;
    const age=ageOf(dob);
    const dobBad = age===null || age<8 || age>18;
    // student email is optional; if given it must be a valid address AND the child must be 13+
    let emailBad=false;
    if(semail){ emailBad = (age!==null && age<13) || !emailRe.test(semail); }
    markEl(b.querySelector('.kf-name'), !name); if(!name) ok=false;
    markEl(b.querySelector('.kf-dob'), dobBad); if(dobBad) ok=false;
    markEl(b.querySelector('.kf-grade'), !grade); if(!grade) ok=false;
    markEl(b.querySelector('.kf-school'), !school); if(!school) ok=false;
    markEl(b.querySelector('.kf-stype'), !stype); if(!stype) ok=false;
    markEl(b.querySelector('.kf-email'), emailBad); if(emailBad) ok=false;
    if(age!==null && age<13) anyUnder13=true;
    kids.push({name,dob,age,grade,school,stype,semail,accom,device});
  });

  const ckR=document.getElementById('ck-rules'), ckE=document.getElementById('ck-res'), ckP=document.getElementById('ck-priv');
  ckR.closest('.ck').classList.toggle('invalid', !ckR.checked);
  ckE.closest('.ck').classList.toggle('invalid', !ckE.checked);
  ckP.closest('.ck').classList.toggle('invalid', !ckP.checked);
  if(!(ckR.checked && ckE.checked && ckP.checked)) ok=false;
  need('f-sign', sign.length>1);

  if(!ok) return;

  const btn=regForm.querySelector('.form-submit'); const errBox=document.getElementById('form-error');
  if(errBox) errBox.style.display='none';
  const label=btn.textContent; btn.disabled=true; btn.textContent='Registering\u2026';

  const payload={
    parent_name:pname, phone, email,
    address:`${street}${unit?', '+unit:''}, ${city}, ${state} ${zip}`,
    zip, child_count:kids.length,
    students:kids.map((k,i)=>`#${i+1} ${k.name} — DOB ${k.dob} (age ${k.age}), ${k.grade}, ${k.school} [${k.stype}]${k.semail?', email: '+k.semail:''}${k.accom?', accom: '+k.accom:''}${k.device?'':', NO home device'}`).join('  |  '),
    coppa_required: anyUnder13 ? 'YES — has a child under 13' : 'no',
    next_step: anyUnder13 ? 'Email COPPA consent forms to parent' : 'Email TimeBack account setup',
    heard, signed_by:sign,
    _subject:`Speedrun registration: ${pname} — ${kids.length} child${kids.length>1?'ren':''}, ZIP ${zip}${anyUnder13?' · COPPA':''}`
  };

  try{ const arr=JSON.parse(localStorage.getItem('asrReg')||'[]'); arr.push({...payload, ts:Date.now()}); localStorage.setItem('asrReg', JSON.stringify(arr)); }catch(_){}

  let saved=false;
  if(REG_CONFIGURED){
    try{
      const res=await fetch(REG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
      saved=res.ok;
    }catch(_){ saved=false; }
  }
  btn.disabled=false; btn.textContent=label;
  if(REG_CONFIGURED && !saved){ if(errBox) errBox.style.display='block'; return; }

  const first=pname.split(' ')[0];
  const many=kids.length>1;
  const body = anyUnder13
    ? `<h3>Almost there, ${first}!</h3>
       <p>Because ${many?'one or more of your children is':'your child is'} <b>under 13</b>, a parent has to sign the <b>consent forms</b> before they can start. We've emailed them to <b>${email}</b> — sign those and ${many?'your kids are':'your child is'} in.</p>
       <p class="ss-note">Any child 13+ will also get a TimeBack setup link at that email.</p>`
    : `<h3>You're in, ${first}!</h3>
       <p>We've emailed <b>${email}</b> a link to set up your ${many?"children's":"child's"} <b>TimeBack</b> account. Follow it and you're set for the season.</p>`;

  document.getElementById('formCard').innerHTML = `
    <div class="form-success">
      <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      ${body}
      <div class="ss-detail">${REG_CONFIGURED?'Registered':'Recorded (demo)'} \u00b7 ${kids.length} child${many?'ren':''} \u00b7 ZIP ${zip}</div>
    </div>`;
  document.getElementById('formCard').scrollIntoView({behavior:'smooth',block:'center'});
});
