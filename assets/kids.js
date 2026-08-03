// ---- logo ----
document.getElementById('logo').innerHTML = window.ASR_WORDMARK(28);
document.getElementById('logoFoot').innerHTML = window.ASR_WORDMARK_TEXT();

// ---- ticker ----
(function(){
  const items = [
    'SEASON STARTS <b>AUG 24, 2026</b>','MATH/SCIENCE CROWN <b>$100,000</b>','READING/LANGUAGE CROWN <b>$100,000</b>','DOUBLE CROWN <b>$200,000</b>',
    'EFFORT GRAND <b>$50,000</b>','MOST TIMEBACK XP WINS','<b>FREE</b> ALL SEASON','92 ZIP TEAMS','<b>$1,000</b> WINNERS CITYWIDE','19-WEEK SEASON','WINTER GRIND <b>DEC 19–JAN 3</b>',
    'BREAK THE SCALE: <b>MATH 300</b>','1 PRIZE PER <b>25 KIDS</b>'
  ];
  const html = items.map(i=>'<span>'+i+'</span>').join('');
  document.getElementById('ticker').innerHTML = html + html;
})();

// ---- countdown to Aug 24 2026 (Central) ----
(function(){
  const target = new Date('2026-08-24T08:00:00-05:00').getTime();
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
  math: {label:'MAP Math + AlphaTest math/science', rows:[
    ['Priya R.','Grade 8 · 78660 Pflugerville','2,984'],
    ['Alex H.','Grade 8 · 78703 Austin','2,921'],
    ['Sofia M.','Grade 6 · 78704 Austin','2,877'],
    ['Logan M.','Grade 8 · 78613 Cedar Park','2,804'],
    ['Ava K.','Grade 7 · 78681 Round Rock','2,760'],
    ['Isaac J.','Grade 8 · 78666 San Marcos','2,712'],
    ['Liam O.','Grade 8 · 78664 Round Rock','2,690'],
    ['Nadia H.','Grade 6 · 78745 Austin','2,641'],
  ]},
  read: {label:'MAP Reading + Language + AlphaTest ELA', rows:[
    ['Sofia M.','Grade 6 · 78704 Austin','2,958'],
    ['Nadia H.','Grade 6 · 78745 Austin','2,902'],
    ['Priya R.','Grade 8 · 78660 Pflugerville','2,861'],
    ['Logan M.','Grade 8 · 78613 Cedar Park','2,833'],
    ['Alex H.','Grade 8 · 78703 Austin','2,788'],
    ['Ava K.','Grade 7 · 78681 Round Rock','2,744'],
    ['Isaac J.','Grade 8 · 78666 San Marcos','2,701'],
    ['Liam O.','Grade 8 · 78664 Round Rock','2,655'],
  ]},
  speed: {label:'Timeback XP earned', rows:[
    ['Logan M.','Grade 8 · 78613 Cedar Park','184,200 XP'],
    ['Nadia H.','Grade 6 · 78745 Austin','179,600 XP'],
    ['Sofia M.','Grade 6 · 78704 Austin','171,050 XP'],
    ['Alex H.','Grade 8 · 78703 Austin','168,400 XP'],
    ['Priya R.','Grade 8 · 78660 Pflugerville','162,900 XP'],
    ['Isaac J.','Grade 8 · 78666 San Marcos','158,300 XP'],
    ['Ava K.','Grade 7 · 78681 Round Rock','151,700 XP'],
    ['Liam O.','Grade 8 · 78664 Round Rock','147,050 XP'],
  ]},
  climb: {label:'VGLs per week enrolled', rows:[
    ['Liam O.','Grade 8 · 78664 Round Rock','1.8 / wk'],
    ['Isaac J.','Grade 8 · 78666 San Marcos','1.7 / wk'],
    ['Priya R.','Grade 8 · 78660 Pflugerville','1.6 / wk'],
    ['Logan M.','Grade 8 · 78613 Cedar Park','1.5 / wk'],
    ['Nadia H.','Grade 6 · 78745 Austin','1.4 / wk'],
    ['Alex H.','Grade 8 · 78703 Austin','1.3 / wk'],
    ['Sofia M.','Grade 6 · 78704 Austin','1.2 / wk'],
    ['Ava K.','Grade 7 · 78681 Round Rock','1.1 / wk'],
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
function lookupZip(zip){
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
    <div class="zr-kids">
      <div><span>Est. middle schoolers</span><b>${kids.toLocaleString()}</b></div>
      <div><span>Guaranteed prizes</span><b style="color:var(--accent)">3 × $1,000</b></div>
      <div><span>Prizes grow</span><b>+$1,000 / 25 kids</b></div>
    </div>
    <div class="zr-guar">Your zip code is guaranteed <b>3 × $1,000</b> prizes all season for ${zip}'s best <b>mathematician</b>, best <b>reader</b>, and hardest worker (<b>top XP</b>). Winners are decided at the <b>end of the season (January)</b> from proctored scores. Every <b>25 kids</b> from ${zip} who sign up unlocks <b>another $1,000 winner</b>.</div>
    <p class="zr-cta">Get your parent to sign you up, then <b>invite friends</b> so ${zip} climbs the zip code team board.</p>
  `;
  el2.scrollIntoView({behavior:'smooth',block:'nearest'});
}
document.getElementById('zipGo').addEventListener('click',()=>lookupZip(document.getElementById('zipIn').value.trim()));
document.getElementById('zipIn').addEventListener('keydown',e=>{if(e.key==='Enter')lookupZip(e.target.value.trim())});
document.getElementById('zipIn').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,5)});
document.querySelectorAll('.zh').forEach(b=>b.addEventListener('click',()=>{
  document.getElementById('zipIn').value=b.dataset.z; lookupZip(b.dataset.z);
}));

// ---- share ----
document.getElementById('shareBtn').addEventListener('click',()=>{
  const link = 'https://austin.gt.school/?ref=speedrun';
  const msg = document.getElementById('shareMsg');
  navigator.clipboard && navigator.clipboard.writeText(link).then(()=>{
    msg.textContent='Copied! Share it. Verified signups credit you.';
  }).catch(()=>{ msg.textContent='Your link: '+link; });
});
