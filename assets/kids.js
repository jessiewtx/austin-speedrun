// ---- logo ----
document.getElementById('logo').innerHTML = window.ASR_WORDMARK(28);
document.getElementById('logoFoot').innerHTML = window.ASR_WORDMARK(24);

// ---- ticker ----
(function(){
  const items = [
    'SEASON STARTS <b>AUG 24, 2026</b>','MATH/SCIENCE CROWN <b>$100,000</b>','READING/LANGUAGE CROWN <b>$100,000</b>','DOUBLE CROWN <b>$200,000</b>',
    'EFFORT GRAND <b>$50,000</b>','MOST TIMEBACK XP WINS','<b>FREE</b> ALL SEASON','99 ZIP TEAMS','<b>$1,000</b> WINNERS CITYWIDE','19-WEEK SEASON','WINTER GRIND <b>DEC 19–JAN 3</b>',
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
    ['Wei-Lin C.','Grade 8 · 78613 Cedar Park','2,921'],
    ['Marcus T.','Grade 7 · 78641 Leander','2,877'],
    ['Deshawn B.','Grade 8 · 78130 New Braunfels','2,804'],
    ['Ava K.','Grade 7 · 78681 Round Rock','2,760'],
    ['Liam O.','Grade 8 · 78664 Round Rock','2,712'],
    ['Sofia M.','Grade 6 · 78704 Austin','2,690'],
    ['Nadia H.','Grade 6 · 78745 Austin','2,641'],
  ]},
  read: {label:'MAP Reading + Language + AlphaTest ELA', rows:[
    ['Sofia M.','Grade 6 · 78704 Austin','2,958'],
    ['Nadia H.','Grade 6 · 78745 Austin','2,902'],
    ['Ava K.','Grade 7 · 78681 Round Rock','2,861'],
    ['Priya R.','Grade 8 · 78660 Pflugerville','2,833'],
    ['Liam O.','Grade 8 · 78664 Round Rock','2,788'],
    ['Marcus T.','Grade 7 · 78641 Leander','2,744'],
    ['Deshawn B.','Grade 8 · 78130 New Braunfels','2,701'],
    ['Wei-Lin C.','Grade 8 · 78613 Cedar Park','2,655'],
  ]},
  speed: {label:'Timeback XP earned', rows:[
    ['Emily V.','Grade 6 · 78640 Kyle','184,200 XP'],
    ['Jordan P.','Grade 7 · 78744 Austin','179,600 XP'],
    ['Hana T.','Grade 6 · 78748 Austin','171,050 XP'],
    ['Grace L.','Grade 7 · 78617 Del Valle','168,400 XP'],
    ['Tariq A.','Grade 8 · 78660 Pflugerville','162,900 XP'],
    ['Mateo S.','Grade 6 · 78621 Elgin','158,300 XP'],
    ['Zoe W.','Grade 8 · 78753 Austin','151,700 XP'],
    ['Ibrahim K.','Grade 7 · 78665 Round Rock','147,050 XP'],
  ]},
  climb: {label:'VGLs per week enrolled', rows:[
    ['Jordan P.','Grade 7 · 78744 Austin','1.8 / wk'],
    ['Emily V.','Grade 6 · 78640 Kyle','1.6 / wk'],
    ['Tariq A.','Grade 8 · 78660 Pflugerville','1.5 / wk'],
    ['Grace L.','Grade 7 · 78617 Del Valle','1.4 / wk'],
    ['Mateo S.','Grade 6 · 78621 Elgin','1.3 / wk'],
    ['Zoe W.','Grade 8 · 78753 Austin','1.2 / wk'],
    ['Ibrahim K.','Grade 7 · 78665 Round Rock','1.1 / wk'],
    ['Hana T.','Grade 6 · 78748 Austin','1.0 / wk'],
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
    el.innerHTML = `<div class="zr-top"><div class="zr-zip">${/^\d{5}$/.test(zip)?zip:'—'}</div></div>
      <p style="color:var(--dim)">That zip isn't in the 5-county Austin metro (99 residential zips: Travis, Williamson, Hays, Bastrop, Caldwell). Try one of the samples above.</p>`;
    return;
  }
  const kids = rec.kids;
  // unlock thresholds: fixed kid count OR % of zip's est middle schoolers, whichever is smaller
  const t1 = Math.min(50, Math.ceil(kids*0.25));
  const t2 = Math.min(100, Math.ceil(kids*0.40));
  const t3 = Math.min(150, Math.ceil(kids*0.50));
  const el2=el;
  el2.hidden=false;
  el2.innerHTML = `
    <div class="zr-top">
      <div class="zr-zip">${zip}<span>${rec.county} County</span></div>
      <div class="zr-tier tier-${rec.tier}">Tier ${rec.tier} zip</div>
    </div>
    <div class="zr-kids">
      <div><span>Est. middle schoolers</span><b>${kids.toLocaleString()}</b></div>
      <div><span>Guaranteed champions</span><b style="color:var(--accent)">3 × $1,000</b></div>
      <div><span>Pool growth</span><b>+$5 / signup</b></div>
    </div>
    <div class="zr-guar">Day one, <b>${zip}</b> crowns its <b>mathematician</b>, its <b>reader</b>, and its <b>MVP</b> — <b>3 guaranteed $1,000 champions</b> (top Math/Science score, top Reading/Language score, top XP) — plus one $1,000 winner for every 25 verified kids who join.</div>
    <div class="ladder-h">Your zip unlock ladder — recruit ${rec.county} to switch these on</div>
    ${unlockRow(t1, 'Silver medals unlock', '+$1,000 Math/Science runner-up and +$1,000 Reading/Language runner-up for '+zip)}
    ${unlockRow(t2, 'Grade champions', '+$1,000 each for grades 6, 7 and 8')}
    ${unlockRow(t3, 'Schools switch on', 'Every campus in '+zip+' activates its own prize ladder + a $2,500 bonus injection')}
    <p class="zr-cta">Thresholds are <b>${t1}/${t2}/${t3}</b> verified kids for this zip (50/100/150, or 25%/40%/50% of your ${kids.toLocaleString()} — whichever is smaller). Get your parent to sign you up and start recruiting the block.</p>
  `;
  el2.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function unlockRow(threshold, title, desc){
  return `<div class="unlock"><span class="unlock-badge">${threshold} kids</span><div class="unlock-txt"><b>${title}</b><span>${desc}</span></div></div>`;
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
    msg.textContent='Copied! Share it — verified signups credit you.';
  }).catch(()=>{ msg.textContent='Your link: '+link; });
});
