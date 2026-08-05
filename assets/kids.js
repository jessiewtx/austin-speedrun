// ---- logo ----
document.getElementById('logo').innerHTML = window.ASR_WORDMARK(28);
document.getElementById('logoFoot').innerHTML = window.ASR_WORDMARK_TEXT();

// ---- ticker ----
(function(){
  const items = [
    'SEASON STARTS <b>OCT 5, 2026</b>','MATH/SCIENCE CROWN <b>$100,000</b>','READING/LANGUAGE CROWN <b>$100,000</b>','DOUBLE CROWN <b>$200,000</b>',
    'EFFORT GRAND <b>$50,000</b>','MOST TIMEBACK XP WINS','<b>FREE</b> ALL SEASON','92 ZIP TEAMS','<b>$1,000</b> WINNERS CITYWIDE','MONTHLY EFFORT <b>$5,000</b>','GRADE CHAMPS <b>$10,000</b>',
    'REGISTRATION <b>OPEN NOW</b>'
  ];
  const html = items.map(i=>'<span>'+i+'</span>').join('');
  document.getElementById('ticker').innerHTML = html + html;
})();

// ---- countdown to Oct 5 2026 (Central) ----
(function(){
  const target = new Date('2026-10-05T08:00:00-05:00').getTime();
  const d=document.getElementById('cd-d'),h=document.getElementById('cd-h'),m=document.getElementById('cd-m'),s=document.getElementById('cd-s');
  function pad(n){return String(n).padStart(2,'0')}
  function tick(){
    let diff = target - Date.now();
    if(diff<0){diff=0}
    const dd=Math.floor(diff/86400000), hh=Math.floor(diff%86400000/3600000), mm=Math.floor(diff%3600000/60000), ss=Math.floor(diff%60000/1000);
    d.textContent=pad(dd);h.textContent=pad(hh);m.textContent=pad(mm);s.textContent=pad(ss);
  }
  tick(); setInterval(tick,1000);
})();

// ---- leaderboard (SAMPLE data) ----
const LB = {
  math: {label:'Math + Science score', rows:[
    ['Priya R.','Grade 8 · 78660 Pflugerville','2,984'],
    ['Alex H.','Grade 8 · 78703 Austin','2,921'],
    ['Sofia M.','Grade 6 · 78704 Austin','2,877'],
    ['Logan M.','Grade 8 · 78613 Cedar Park','2,804'],
    ['Ava K.','Grade 7 · 78681 Round Rock','2,760'],
    ['Isaac J.','Grade 8 · 78130 New Braunfels','2,712'],
    ['Liam O.','Grade 8 · 78664 Round Rock','2,690'],
    ['Nadia H.','Grade 6 · 78745 Austin','2,641'],
  ]},
  read: {label:'Reading + Language score', rows:[
    ['Sofia M.','Grade 6 · 78704 Austin','2,958'],
    ['Nadia H.','Grade 6 · 78745 Austin','2,902'],
    ['Priya R.','Grade 8 · 78660 Pflugerville','2,861'],
    ['Logan M.','Grade 8 · 78613 Cedar Park','2,833'],
    ['Alex H.','Grade 8 · 78703 Austin','2,788'],
    ['Ava K.','Grade 7 · 78681 Round Rock','2,744'],
    ['Isaac J.','Grade 8 · 78130 New Braunfels','2,701'],
    ['Liam O.','Grade 8 · 78664 Round Rock','2,655'],
  ]},
  speed: {label:'Timeback XP earned', rows:[
    ['Logan M.','Grade 8 · 78613 Cedar Park','184,200 XP'],
    ['Nadia H.','Grade 6 · 78745 Austin','179,600 XP'],
    ['Sofia M.','Grade 6 · 78704 Austin','171,050 XP'],
    ['Alex H.','Grade 8 · 78703 Austin','168,400 XP'],
    ['Priya R.','Grade 8 · 78660 Pflugerville','162,900 XP'],
    ['Isaac J.','Grade 8 · 78130 New Braunfels','158,300 XP'],
    ['Ava K.','Grade 7 · 78681 Round Rock','151,700 XP'],
    ['Liam O.','Grade 8 · 78664 Round Rock','147,050 XP'],
  ]},
};
function renderLB(key){
  const data = LB[key];
  let html = '<div class="lbrow head"><span>Rank</span><span>Player (sample)</span><span>'+data.label+'</span></div>';
  data.rows.forEach((r,i)=>{
    html += `<div class="lbrow r${i+1}"><span class="rank">#${i+1}</span><div class="player"><b>${r[0]}</b><span>${r[1]}</span></div><span class="metric">${r[2]}</span></div>`;
  });
  document.getElementById('lb').innerHTML = html;
}
renderLB('math');
document.getElementById('boardTabs').addEventListener('click',e=>{
  const b=e.target.closest('.btab'); if(!b)return;
  document.querySelectorAll('.btab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); renderLB(b.dataset.b);
});

// ---- ZIP lookup ----
const ZD = window.ZIP_DATA || {};
function pct(kids, threshold){ return Math.min(100, Math.round(threshold/kids*100)); }

// ---- live signups per zip (Supabase RPC) ----
function zipSB(){
  const cfg = window.ASR_SUPABASE;
  if(!cfg || !cfg.url || !cfg.anonKey || cfg.url.indexOf('YOUR_PROJECT_REF') > -1) return null;
  if(!window.supabase || !window.supabase.createClient) return null;
  if(!window.__asrSB) window.__asrSB = window.supabase.createClient(cfg.url, cfg.anonKey);
  return window.__asrSB;
}
async function zipSignupCount(zip){
  const sb = zipSB();
  if(!sb) return null;
  try{
    const { data, error } = await sb.rpc('zip_signup_count', { p_zip: zip });
    if(error) return null;
    if(typeof data === 'number') return data;
    if(data && typeof data.count === 'number') return data.count;
    const n = Number(data);
    return isNaN(n) ? null : n;
  }catch(e){ return null; }
}

function lookupZip(zip){
  lookupZip._cur = zip;
  const el = document.getElementById('zipResult');
  const rec = ZD[zip];
  if(!rec){
    el.hidden=false;
    el.innerHTML = `<div class="zr-top"><div class="zr-zip">${/^\d{5}$/.test(zip)?zip:'-'}</div></div>
      <p style="color:var(--dim)">That zip code isn't in the 5-county Austin metro (92 zip codes across Travis, Williamson, Hays, Bastrop, Caldwell). Try one of the samples above.</p>`;
    return;
  }
  const kids = rec.kids;
  const el2=el;
  el2.hidden=false;
  el2.innerHTML = `
    <div class="zr-top">
      <div class="zr-zip">${zip}<span>${rec.county} County</span></div>
      <div class="zr-tier tier-${rec.tier}">Tier ${rec.tier} zip code</div>
    </div>
    <div class="zr-live" id="zrLive" hidden></div>
    <div class="zr-kids">
      <div><span>Est. middle schoolers</span><b>${kids.toLocaleString()}</b></div>
      <div><span>Guaranteed prizes</span><b style="color:var(--accent)">3 × $1,000</b></div>
      <div><span>Prizes grow</span><b>+$1,000 / 25 kids</b></div>
    </div>
    <div class="zr-guar">Your zip code is guaranteed <b>3 × $1,000</b> prizes all season for ${zip}'s best <b>mathematician</b>, best <b>reader</b>, and hardest worker (<b>top XP</b>). Winners are decided at the <b>end of the season (January)</b> from proctored scores. Every <b>25 kids</b> from ${zip} who sign up unlocks <b>another $1,000 winner</b>.</div>
    <p class="zr-cta">Get your parent to sign you up, then <b>invite friends</b> so ${zip} climbs the zip code team board.</p>
  `;
  el2.scrollIntoView({behavior:'smooth',block:'nearest'});
  zipSignupCount(zip).then(function(n){
    if(lookupZip._cur !== zip || n == null) return; // stale lookup or RPC unavailable
    const live = document.getElementById('zrLive');
    if(!live) return;
    live.innerHTML = '<span class="zr-live-dot"></span><b>'+n.toLocaleString()+'</b> '+(n===1?'kid':'kids')+' from '+zip+' signed up so far';
    live.hidden = false;
  });
}
document.getElementById('zipGo').addEventListener('click',()=>lookupZip(document.getElementById('zipIn').value.trim()));
document.getElementById('zipIn').addEventListener('keydown',e=>{if(e.key==='Enter')lookupZip(e.target.value.trim())});
document.getElementById('zipIn').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,5)});
document.querySelectorAll('.zh').forEach(b=>b.addEventListener('click',()=>{
  document.getElementById('zipIn').value=b.dataset.z; lookupZip(b.dataset.z);
}));

// ---- share ----
document.getElementById('shareBtn').addEventListener('click',()=>{
  // Personal ?ref= codes are shown on the signup success screen after register.
  const link = new URL('parents.html', window.location.href);
  link.search = '';
  link.hash = 'join';
  const msg = document.getElementById('shareMsg');
  navigator.clipboard && navigator.clipboard.writeText(link.toString()).then(()=>{
    msg.textContent='Copied! Share signup — after you register, your success screen has a personal invite link.';
  }).catch(()=>{ msg.textContent='Your link: '+link.toString(); });
});
