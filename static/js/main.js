/* ThermoIQ — Race Intelligence Platform — main.js */
'use strict';

/* ════════════════════════════════════════════
   DATASET
════════════════════════════════════════════ */
const BIKES = [
  {tag:'044B536AD71F90',mfr:'Colnago',  model:'Colnago V4Rs',      team:'UAE Team Emirates', rider:'T. Pogačar',   bib:1,  nat:'🇸🇮',pos:1, gap:'—',      scan:'PASS',comp:'PASS',op:'Q. Mansson',rev:'Q. Mansson',report_id:'RPT1234',summary:'All checks PASS. Weight 6.94 kg. Aero legal. Motor scan negative. Cleared.',color:'#c00020',stageWins:6,equipScore:97},
  {tag:'044C721BF82A01',mfr:'Cervélo',  model:'Cervélo R5',         team:'Jumbo-Visma',       rider:'J. Vingegaard',bib:11, nat:'🇩🇰',pos:2, gap:'+0:14',  scan:'PASS',comp:'PASS',op:'A. Bakker',  rev:'A. Bakker',  report_id:'RPT1235',summary:'Weight 7.01 kg. All aero surfaces within tolerance. PASS.',color:'#f0c000',stageWins:4,equipScore:94},
  {tag:'044D890CE93B12',mfr:'Pinarello',model:'Pinarello Dogma F',  team:'INEOS Grenadiers',  rider:'G. Thomas',    bib:21, nat:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',pos:5, gap:'+0:55',  scan:'PASS',comp:'FAIL',op:'L. Brown',   rev:'L. Brown',   report_id:'RPT1236',summary:'FAIL: Handlebar width 4 mm outside UCI max. Rider must change bars before start.',color:'#000080',stageWins:2,equipScore:78},
  {tag:'044E105DF04C23',mfr:'Cannondale',model:'Cannondale SuperSix',team:'EF Education',     rider:'R. Carapaz',   bib:31, nat:'🇪🇨',pos:6, gap:'+1:08',  scan:'PASS',comp:'PASS',op:'Q. Mansson',rev:'Q. Mansson',report_id:'RPT1237',summary:'All checks PASS. Motor scan negative. Aero legal. Weight 7.08 kg. Cleared.',color:'#00b050',stageWins:1,equipScore:88},
  {tag:'044F328EG15D34',mfr:'Canyon',    model:'Canyon Ultimate CF', team:'Movistar Team',     rider:'E. Mas',       bib:41, nat:'🇪🇸',pos:9, gap:'+2:04',  scan:'PASS',comp:'PASS',op:'A. Bakker',  rev:'A. Bakker',  report_id:'RPT1238',summary:'All systems checked. Weight compliant. Motor scan clear. PASS.',color:'#e00060',stageWins:1,equipScore:85},
  {tag:'0450441FH26E45',mfr:'Trek',      model:'Trek Madone SLR',   team:'Trek-Segafredo',    rider:'M. Stuyven',   bib:51, nat:'🇧🇪',pos:88,gap:'+DNQ',   scan:'FAIL',comp:'FAIL',op:'L. Brown',   rev:'L. Brown',   report_id:'RPT1239',summary:'FAIL: Suspected motor device. Flagged for secondary inspection. Rider DNQ.',color:'#e06020',stageWins:0,equipScore:42},
  {tag:'0451552GI37F56',mfr:'Merida',    model:'Merida Scultura',   team:'Bahrain Victorious', rider:'J. Haig',     bib:61, nat:'🇦🇺',pos:14,gap:'+3:22',  scan:'PASS',comp:'PASS',op:'Q. Mansson',rev:'Q. Mansson',report_id:'RPT1240',summary:'Standard checks complete. Weight 7.14 kg. PASS.',color:'#e00020',stageWins:0,equipScore:80},
  {tag:'0452663HJ48G67',mfr:'Colnago',  model:'Colnago V4Rs',      team:'AG2R Citroën',      rider:'B. Naesen',    bib:71, nat:'🇧🇪',pos:22,gap:'+5:02',  scan:'PASS',comp:'PEND',op:'A. Bakker',  rev:'A. Bakker',  report_id:'RPT1241',summary:'PENDING: Weight 6.72 kg marginally below UCI minimum 6.80 kg. Awaiting decision.',color:'#0080a0',stageWins:0,equipScore:72},
];

const CHECKS = [
  {label:'Frame weight',   pv:'6.94 kg ✓',fv:'6.72 kg ✗',qv:'Weighing…'},
  {label:'Aero section',   pv:'3:1 ratio ✓',fv:'Flagged ✗',qv:'Measuring…'},
  {label:'Motor scan',     pv:'Negative ✓',fv:'Suspected ✗',qv:'Scanning…'},
  {label:'Wheel spec',     pv:'Legal ✓',fv:'Illegal rim ✗',qv:'Checking…'},
  {label:'Handlebar width',pv:'420 mm ✓',fv:'424 mm ✗',qv:'Measuring…'},
  {label:'Mechanical',     pv:'Clear ✓',fv:'Issue found ✗',qv:'Pending…'},
];

const EQUIPMENT = [
  {cat:'Frames',icon:'🚲',brand:'Colnago',wins:6,pct:38,model:'V4Rs'},
  {cat:'Frames',icon:'🚲',brand:'Cervélo',wins:4,pct:25,model:'R5'},
  {cat:'Helmets',icon:'⛑',brand:'Kask',wins:8,pct:50,model:'Utopia Y'},
  {cat:'Helmets',icon:'⛑',brand:'Specialized',wins:5,pct:31,model:'S-Works Evade 3'},
  {cat:'Wheels',icon:'🔵',brand:'Zipp',wins:7,pct:44,model:'NSW 858'},
  {cat:'Wheels',icon:'🔵',brand:'Lightweight',wins:4,pct:25,model:'Meilenstein'},
  {cat:'Tyres',icon:'⚫',brand:'Continental',wins:9,pct:56,model:'GP TT'},
  {cat:'Power meters',icon:'📡',brand:'Quarq',wins:6,pct:38,model:'DZero'},
  {cat:'Groupsets',icon:'⚙',brand:'Shimano',wins:10,pct:63,model:'Dura-Ace Di2'},
];

const SOCIAL_POSTS = [
  {handle:'@VeloInsider',avatar:'V',color:'#8840e0',src:'ig',time:'2m',text:'📸 Pogačar absolutely flying on the Colnago V4Rs. That aero position is next level. #TdF2026 #Colnago',tags:['#TdF2026','#Colnago','#Pogacar'],likes:'4.2k',emoji:'🔥'},
  {handle:'@CyclingProTV',avatar:'C',color:'#0058c8',src:'tw',time:'4m',text:'The gap is coming DOWN. Breakaway has just 1:14 on the peloton. Jumbo-Visma setting tempo. Watch Vingegaard.',tags:['#TdF2026','#Jumbo'],likes:'2.8k',emoji:'🚴'},
  {handle:'@BikeNerdDaily',avatar:'B',color:'#f07820',src:'ig',time:'7m',text:'Spotted: Kask Utopia Y on 11/16 riders in the lead group today. That\'s an 87.5% market share at the front. Incredible numbers. #helmets',tags:['#Kask','#Helmets'],likes:'1.1k',emoji:'⛑'},
  {handle:'@ThomasWatch',avatar:'T',color:'#e02828',src:'tw',time:'12m',text:'G. Thomas riding with a temporary handlebar today after failing UCI check this morning. Drama at the start!',tags:['#INEOS','#UCI'],likes:'3.4k',emoji:'⚠'},
  {handle:'@EquipmentSpotter',avatar:'E',color:'#22b858',src:'ig',time:'18m',text:'Continental GP TT tyres on 9 of the top 10 GC riders. Fastest tyre in the peloton right now. No debate. #tyres #cycling',tags:['#Continental','#Tyres'],likes:'876',emoji:'⚫'},
  {handle:'@RaceControl',avatar:'R',color:'#c89820',src:'tw',time:'25m',text:'Official: Trek Madone #51 excluded after positive motor scan. First mechanical doping case at this year\'s race.',tags:['#UCI','#MechanicalDoping'],likes:'12k',emoji:'🚨'},
];

const WHY_WON = {
  stage:11,winner:'T. Pogačar',bike:'Colnago V4Rs',
  factors:[
    {title:'Colnago V4Rs aerodynamics',detail:'The V4Rs fork and seat tube produced 18W saving vs closest competitor at 50 km/h. Measured advantage across 178 km climb finish.',equip:'Colnago V4Rs · frame aero score: 97/100'},
    {title:'Kask Utopia Y ventilation',detail:'Core temperature 0.8°C lower vs Specialized S-Works riders in 34°C heat. Power maintained in final 8 km where rivals faded.',equip:'Kask Utopia Y · heat management score: 94/100'},
    {title:'Shimano Dura-Ace Di2 shifting',detail:'Zero missed shifts in final 3 km attacks. Competitors recorded 2-4 shifts delayed >200ms under peak power.',equip:'Shimano Dura-Ace Di2 · reliability: 99.8%'},
    {title:'Continental GP TT tyre grip',detail:'Highest cornering stability in wet section KM 141–153. Average 3.1 km/h faster through corners than non-Continental riders.',equip:'Continental GP TT · grip score: 96/100'},
  ],
};

const SELL_CARDS = [
  {icon:'🏭',title:'Manufacturer Intelligence',desc:'Performance correlation data. Does your frame win more? Which wheel wins in mountain stages? Sold per brand.',price:'€12,000 / season',label:'Per manufacturer'},
  {icon:'📺',title:'Broadcaster Data Pack',desc:'Real-time equipment telemetry overlay. Equipment IDs on screen during live broadcast. Sponsorship identification.',price:'€45,000 / race',label:'Per race'},
  {icon:'🏆',title:'Team Analytics Suite',desc:'Bike compliance history, competitor equipment scouting, pre-race risk alerts, NFC scanning app for mechanics.',price:'€8,000 / season',label:'Per team'},
  {icon:'🎽',title:'Component Brand Reports',desc:'Helmet, wheel, tyre, groupset brand data. Win correlation reports. Shared with sponsors and media.',price:'€5,000 / season',label:'Per component brand'},
  {icon:'🎮',title:'Fan Prediction Platform',desc:'Real-time predictions, equipment-based fantasy cycling, stage analysis. Fan engagement product.',price:'€2 / user / month',label:'B2C subscription'},
  {icon:'🏛',title:'UCI Compliance SaaS',desc:'NFC scanning, instant compliance check, motor scan integration, automated reporting to UCI officials.',price:'€80,000 / year',label:'Per race organisation'},
];

/* ════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════ */
function topNav(name, el) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  if(el && el.classList.contains('tab')) el.classList.add('on');
  else document.querySelectorAll('.tab').forEach((t,i)=>{if(['race','fan','uci','mfr'][i]===name)t.classList.add('on');});
  ['race','fan','uci','mfr'].forEach(n=>document.getElementById('pane-'+n).classList.toggle('on',n===name));
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', ()=>{
  buildGCList();
  buildRiderDots();
  buildFanZone();
  buildMfrDash();
  buildScanHistory();
  setFlowStep(0);
  startLiveClock();
  startLiveUpdates();
  startFeedUpdater();
});

/* ════════════════════════════════════════════
   LIVE RACE
════════════════════════════════════════════ */
const GC = [
  {bib:1, name:'T. Pogačar',nat:'🇸🇮',team:'UAE',pos:1,gap:'—',   bike:'044B536AD71F90',color:'#c00020',kmPos:148},
  {bib:11,name:'J. Vingegaard',nat:'🇩🇰',team:'JV', pos:2,gap:'+0:14',bike:'044C721BF82A01',color:'#f0c000',kmPos:145},
  {bib:41,name:'E. Mas',nat:'🇪🇸',team:'MOV',pos:3,gap:'+1:44',bike:'044F328EG15D34',color:'#e00060',kmPos:142},
  {bib:21,name:'G. Thomas',nat:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',team:'INEOS',pos:4,gap:'+0:55',bike:'044D890CE93B12',color:'#4040a0',kmPos:140},
  {bib:31,name:'R. Carapaz',nat:'🇪🇨',team:'EF',  pos:5,gap:'+1:08',bike:'044E105DF04C23',color:'#e04040',kmPos:138},
  {bib:61,name:'J. Haig',nat:'🇦🇺',team:'BAH',pos:6,gap:'+3:22',bike:'044F328EG15D34',color:'#c00020',kmPos:132},
];

function buildGCList() {
  document.getElementById('gc-list').innerHTML = GC.map((r,i) => {
    const pcls = i===0?'p1':i===1?'p2':i===2?'p3':'';
    const comp = BIKES.find(b=>b.tag===r.bike);
    const dotCls = comp?.comp==='FAIL'?'var(--red)':comp?.comp==='PEND'?'var(--amber)':'var(--green)';
    return `<div class="gc-item" id="gci-${r.bib}" onclick="showRider(${r.bib})">
      <div class="gc-pos ${pcls}">${r.pos}</div>
      <div style="display:flex;flex-direction:column;flex:1">
        <div class="gc-name">${r.nat} ${r.name}</div>
        <div style="font-family:var(--fm);font-size:8px;color:var(--white3)">${r.team}</div>
      </div>
      <div class="gc-gap">${r.gap}</div>
      <div class="gc-dot" style="background:${dotCls}"></div>
    </div>`;
  }).join('');
}

function buildRiderDots() {
  const g = document.getElementById('rider-dots');
  g.innerHTML = GC.map(r => {
    const x = (r.kmPos/178)*276+2;
    const y = getElevationY(r.kmPos);
    return `<circle class="rider-dot" cx="${x}" cy="${y}" r="4.5" fill="${r.color}" stroke="var(--dark)" stroke-width="1.5" onclick="showRider(${r.bib})" title="${r.name}"><title>${r.name}</title></circle>`;
  }).join('');
}

function getElevationY(km) {
  // matches the SVG path roughly
  const profile = [80,78,72,65,58,50,42,35,28,22,18,14,16,20,26,34,42,50,58,65,70,72];
  const idx = Math.min(Math.floor((km/178)*profile.length), profile.length-1);
  return profile[idx] - 5;
}

function showRider(bib) {
  document.querySelectorAll('.gc-item').forEach(el=>el.classList.remove('on'));
  document.getElementById('gci-'+bib)?.classList.add('on');
  const rider = GC.find(r=>r.bib===bib);
  const bike  = BIKES.find(b=>b.tag===rider?.bike);
  if(!rider) return;

  const compStatus = bike?.comp || 'N/A';
  const sbCls = compStatus==='PASS'?'sb-pass':compStatus==='FAIL'?'sb-fail':compStatus==='PEND'?'sb-pend':'';
  const posStr = rider.pos<=3?['🥇','🥈','🥉'][rider.pos-1]+'#'+rider.pos:'#'+rider.pos;

  // equipment for this rider
  const eqRows = [
    {icon:'🚲',name:bike?.model||'—',brand:bike?.mfr||'—',win:91},
    {icon:'⛑',name:'Kask Utopia Y',brand:'Kask',win:88},
    {icon:'🔵',name:'Zipp NSW 858',brand:'Zipp',win:84},
    {icon:'⚙',name:'Shimano Dura-Ace Di2',brand:'Shimano',win:96},
    {icon:'⚫',name:'Continental GP TT',brand:'Continental',win:92},
    {icon:'📡',name:'Quarq DZero',brand:'Quarq',win:78},
  ];

  document.getElementById('rider-spot').innerHTML = `
    <div class="spot-hero">
      <div class="spot-num" style="background:${rider.color}22;border:1px solid ${rider.color}55;color:${rider.color}">${rider.bib}</div>
      <div class="spot-data">
        <div class="spot-name">${rider.nat} ${rider.name}</div>
        <div class="spot-team">${rider.team}</div>
        <div class="spot-pills">
          <div class="pill gold">GC ${rider.pos}</div>
          <div class="pill">Gap ${rider.gap}</div>
          ${compStatus==='PASS'?'<div class="pill green">✓ Compliant</div>':compStatus==='FAIL'?'<div class="pill red">✗ Flagged</div>':'<div class="pill">⏳ Pending</div>'}
          ${bike?`<div class="pill">${bike.tag.slice(0,10)}…</div>`:''}
        </div>
      </div>
      <div class="spot-pos">${posStr}</div>
    </div>
    <div class="telem-row">
      <div class="telem"><div class="telem-val" style="color:var(--gold)">${(38+Math.random()*10).toFixed(1)}</div><div class="telem-label">km/h</div></div>
      <div class="telem"><div class="telem-val">${Math.floor(270+Math.random()*90)}</div><div class="telem-label">watts</div></div>
      <div class="telem"><div class="telem-val">${Math.floor(88+Math.random()*12)}</div><div class="telem-label">rpm</div></div>
      <div class="telem"><div class="telem-val">${Math.floor(1200+Math.random()*600)}</div><div class="telem-label">elev m</div></div>
      <div class="telem"><div class="telem-val" style="color:${compStatus==='PASS'?'var(--green)':compStatus==='FAIL'?'var(--red)':'var(--amber)'}">${compStatus}</div><div class="telem-label">compliance</div></div>
    </div>
    <div class="equip-card">
      <div class="eq-title">🔧 Equipment — ${rider.name}</div>
      <div class="eq-grid">
        ${eqRows.map(eq=>`<div class="eq-item" onclick="showEquipDetail('${eq.brand}')">
          <div class="eq-icon">${eq.icon}</div>
          <div>
            <div class="eq-name">${eq.name}</div>
            <div class="eq-brand">${eq.brand}</div>
            <div class="eq-win"><span class="eq-win-pct">${eq.win}%</span> win rate with this kit</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
    ${bike?`<div class="equip-card">
      <div class="eq-title">📡 NFC Compliance — <span style="font-family:var(--fm);font-size:10px;color:var(--gold)">${bike.tag}</span></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div class="sbadge ${sbCls}">${compStatus==='PEND'?'PENDING':compStatus}</div>
        <div style="font-size:11px;color:var(--white3)">${bike.summary.slice(0,60)}…</div>
        <button onclick="loadTag('${bike.tag}');topNav('uci')" style="font-family:var(--fm);font-size:8px;padding:3px 8px;border:1px solid var(--uci2);border-radius:var(--r);cursor:pointer;background:transparent;color:var(--uci2);text-transform:uppercase;letter-spacing:.05em">Full report</button>
      </div>
    </div>`:''}`;
}

function showEquipDetail(brand) {
  toast('Viewing: '+brand+' performance data → switch to Fan Zone or Manufacturers');
}

/* ════════════════════════════════════════════
   FAN ZONE
════════════════════════════════════════════ */
const PRED_FACTORS = [
  {label:'Climbing ability',val:94,bar:94},
  {label:'Current form',val:88,bar:88},
  {label:'Bike aero score',val:97,bar:97},
  {label:'Stage profile match',val:82,bar:82},
  {label:'Equipment reliability',val:91,bar:91},
];

function buildFanZone() {
  // prediction factors
  document.getElementById('pred-factors').innerHTML = PRED_FACTORS.map(f=>`
    <div class="pf-item">
      <div class="pf-label">${f.label}</div>
      <div class="pf-bar-wrap"><div class="pf-bar" style="width:${f.bar}%"></div></div>
      <div class="pf-val">${f.val}</div>
    </div>`).join('');

  // pick buttons
  document.getElementById('pick-row').innerHTML = GC.slice(0,5).map((r,i)=>{
    const prob = [68,18,8,4,2][i];
    return `<button class="pick-btn" onclick="makePick(this,'${r.name}')">
      <div class="pb-name">${r.nat} ${r.name}</div>
      <div class="pb-odds">${[1.5,5.5,12.5,25,50][i]}x</div>
      <div class="pb-prob" style="color:${i===0?'var(--gold)':'var(--white3)'}">${prob}%</div>
    </button>`;
  }).join('');

  // social feed
  buildSocialFeed();

  // why they won
  document.getElementById('why-card').innerHTML = `
    <div class="wc-header">
      <div class="wc-icon">🏆</div>
      <div>
        <div class="wc-title">Why ${WHY_WON.winner} won Stage ${WHY_WON.stage}</div>
        <div class="wc-stage" style="font-family:var(--fm);font-size:8px;color:var(--gold)">Equipment analysis · ${WHY_WON.bike}</div>
      </div>
    </div>
    ${WHY_WON.factors.map((f,i)=>`<div class="why-factor">
      <div class="wf-num">${i+1}</div>
      <div class="wf-content">
        <div class="wf-title">${f.title}</div>
        <div class="wf-detail">${f.detail}</div>
        <div class="wf-equip">🔧 ${f.equip}</div>
      </div>
    </div>`).join('')}`;

  // equipment winners grid
  document.getElementById('ew-grid').innerHTML = EQUIPMENT.map(eq=>`
    <div class="ew-item" onclick="toast('${eq.brand} ${eq.cat}: ${eq.wins} stage wins (${eq.pct}%)')">
      <div class="ew-icon">${eq.icon}</div>
      <div class="ew-brand">${eq.brand}</div>
      <div class="ew-cat">${eq.cat} · ${eq.model}</div>
      <div class="ew-wins">${eq.wins}</div>
      <div class="ew-wins-label">stage wins</div>
      <div class="ew-pct" style="color:${eq.pct>50?'var(--green)':eq.pct>30?'var(--gold)':'var(--white3)'}">Market share: ${eq.pct}%</div>
    </div>`).join('');
}

function buildSocialFeed() {
  document.getElementById('social-feed-list').innerHTML = SOCIAL_POSTS.map((p,i)=>`
    <div class="sf-item" style="animation-delay:${i*.06}s">
      <div class="sf-meta">
        <div class="sf-avatar" style="background:${p.color}">${p.avatar}</div>
        <div class="sf-handle">${p.handle}</div>
        <div class="sf-time">${p.time} ago</div>
        <div class="sf-source ${p.src==='ig'?'sf-src-ig':'sf-src-tw'}">${p.src==='ig'?'IG':'TW'}</div>
      </div>
      <div class="sf-text">${p.text}</div>
      <div class="sf-tags">${p.tags.map(t=>`<span class="sf-tag">${t}</span>`).join('')}</div>
      <div class="sf-likes">❤ ${p.likes} · ${p.emoji}</div>
    </div>`).join('');
}

let pickChosen = null;
function makePick(btn, name) {
  document.querySelectorAll('.pick-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  pickChosen = name;
  toast('Pick locked: '+name+' — you\'ll earn points if they win!');
}

/* image analysis */
function dzov(e,id){e.preventDefault();document.getElementById(id).classList.add('drag')}
function dzou(id){document.getElementById(id).classList.remove('drag')}
function dzdp(e){e.preventDefault();dzou('ia-drop');const f=e.dataTransfer.files[0];if(f)processImgAnalysis(f);}
function analyseRaceImg(e){const f=e.target.files[0];if(f)processImgAnalysis(f);e.target.value='';}
function processImgAnalysis(file){
  const url=URL.createObjectURL(file);
  const prev=document.getElementById('ia-preview');
  prev.src=url;prev.style.display='block';
  document.getElementById('ia-result').innerHTML='<div style="color:var(--cyan);animation:pulse 1s infinite">Analysing image…</div>';
  setTimeout(()=>{
    document.getElementById('ia-result').innerHTML=`<div style="color:var(--green);margin-bottom:5px">✓ Equipment identified</div>
<span class="ia-tag" style="border-color:var(--cyan);color:var(--cyan)">🚲 Colnago V4Rs</span>
<span class="ia-tag" style="border-color:var(--cyan);color:var(--cyan)">⛑ Kask Utopia Y</span>
<span class="ia-tag" style="border-color:var(--cyan);color:var(--cyan)">🔵 Zipp NSW 858</span>
<span class="ia-tag" style="border-color:var(--cyan);color:var(--cyan)">⚙ Shimano Di2</span>
<span class="ia-tag" style="border-color:var(--cyan);color:var(--cyan)">⚫ Continental GP TT</span>
<div style="margin-top:6px;font-size:10px;color:var(--white3)">Rider: T. Pogačar · Confidence: 94%<br/>Stage: 12 · Frame compliance: PASS</div>`;
    toast('Equipment identified from image');
  },1200);
}

/* ════════════════════════════════════════════
   UCI OFFICIALS
════════════════════════════════════════════ */
const scanHistory = [];
let demoIdx = 0;

function startScan() {
  const sc=document.getElementById('nfc-scanner'),st=document.getElementById('nfc-status'),ss=document.getElementById('nfc-sub');
  const prog=document.querySelector('.scan-progress'),bar=document.getElementById('scan-bar');
  sc.className='nfc-scanner scanning';st.textContent='Scanning…';ss.textContent='Hold tag near reader';
  prog.style.display='block';setFlowStep(1);
  let w=0;
  const iv=setInterval(()=>{w+=5;bar.style.width=w+'%';if(w>=100){clearInterval(iv);const id=BIKES[demoIdx%BIKES.length].tag;demoIdx++;finishScan(id);}},40);
}
function manualScan(){const id=document.getElementById('me-inp').value.trim().toUpperCase();if(!id){toast('Enter a tag ID');return;}loadTag(id);document.getElementById('me-inp').value='';}
function finishScan(tagId){
  const sc=document.getElementById('nfc-scanner'),st=document.getElementById('nfc-status'),ss=document.getElementById('nfc-sub');
  sc.className='nfc-scanner success';st.textContent='✓ Tag read';ss.textContent=tagId;
  setTimeout(()=>{sc.className='nfc-scanner';st.textContent='Ready to scan';ss.textContent='Tap to simulate NFC read';document.querySelector('.scan-progress').style.display='none';document.getElementById('scan-bar').style.width='0';},1800);
  loadTag(tagId);
}
function loadTag(tagId) {
  const bike=BIKES.find(b=>b.tag===tagId);
  if(!bike){toast('Tag not found: '+tagId);return;}
  renderUCIResult(bike);
  scanHistory.unshift(bike);
  buildScanHistory();
  toast('Loaded: '+tagId);
}
function renderUCIResult(bike) {
  document.getElementById('uci-empty').style.display='none';
  const res=document.getElementById('uci-result');
  res.style.display='block';
  const cs=bike.comp,sc=bike.scan;
  const sbCls=cs==='PASS'?'sb-pass':cs==='FAIL'?'sb-fail':'sb-pend';
  const checkHTML=CHECKS.map((c,i)=>{
    let result,cls;
    const isFail=cs==='FAIL';
    const badCheck=(i===4&&bike.tag.includes('44D'))||(i===2&&bike.tag.includes('450'));
    if(cs==='PASS'){result=c.pv;cls='cr-pass';}
    else if(cs==='PEND'){result=c.qv;cls='cr-pend';}
    else{result=badCheck?c.fv:c.pv;cls=badCheck?'cr-fail':'cr-pass';}
    const icon=cls==='cr-pass'?'✅':cls==='cr-fail'?'❌':'⏳';
    return `<div class="ci"><span class="ci-icon">${icon}</span><span class="ci-label">${c.label}</span><span class="ci-result ${cls}">${result}</span></div>`;
  }).join('');
  res.innerHTML=`
    <div class="tag-card">
      <div class="tc-nfc">📡</div>
      <div class="tc-info">
        <div class="tc-id">${bike.tag}</div>
        <div class="tc-team">${bike.team}</div>
        <div class="tc-model">${bike.rider} · ${bike.model}</div>
        <div class="tc-time">Scanned ${new Date().toLocaleTimeString('en-GB')}</div>
      </div>
    </div>
    <div class="result-grid">
      <div class="rc"><div class="rc-label">Scan ID</div><div class="rc-val mono">${bike.report_id}</div></div>
      <div class="rc"><div class="rc-label">Operator</div><div class="rc-val">${bike.op}</div></div>
      <div class="rc"><div class="rc-label">Scan result</div><div class="rc-val ${sc==='PASS'?'pass':'fail'}">${sc}</div></div>
      <div class="rc"><div class="rc-label">Reviewer</div><div class="rc-val">${bike.rev}</div></div>
    </div>
    <div class="comp-panel">
      <div class="cp-top"><div class="cp-title">Compliance checks</div><div class="sbadge ${sbCls}">${cs==='PEND'?'PENDING':cs}</div></div>
      <div class="check-list">${checkHTML}</div>
    </div>
    <div class="report-panel">
      <div class="rp-top"><div class="cp-title">Report</div><div class="rp-id">${bike.report_id}</div></div>
      <div class="summary">${bike.summary}</div>
      <div class="exp-row">
        <div class="exp-btn" onclick="toast('Printing…')">🖨 Print</div>
        <div class="exp-btn primary" onclick="exportReport('${bike.tag}')">↓ Export PDF</div>
        <div class="exp-btn" onclick="toast('Shared with UCI officials')">Share</div>
      </div>
    </div>`;
  setFlowStep(4);
}
function setFlowStep(s){for(let i=1;i<=4;i++){const el=document.getElementById('fs'+i);if(!el)return;el.classList.remove('done','active');if(i<s)el.classList.add('done');else if(i===s)el.classList.add('active');}}
function buildScanHistory(){
  const items=scanHistory.length?scanHistory:BIKES.slice(0,5);
  document.getElementById('scan-hist-list').innerHTML=items.slice(0,8).map(b=>{
    const cls=b.comp==='PASS'?'b-pass':b.comp==='FAIL'?'b-fail':'b-pend';
    return `<div class="sh-item" onclick="loadTag('${b.tag}')"><div class="shi-id">${b.tag.slice(0,14)}</div><div class="shi-name">${b.rider}</div><span class="badge ${cls}">${b.comp==='PEND'?'PEND':b.comp}</span></div>`;
  }).join('');
}
function exportReport(tag){
  const b=BIKES.find(x=>x.tag===tag);if(!b)return;
  const txt=`ThermoIQ UCI Report\n${'='.repeat(36)}\nTag: ${b.tag}\nTeam: ${b.team}\nRider: ${b.rider}\nBike: ${b.model}\nScan: ${b.scan} (${b.op})\nCompliance: ${b.comp} (${b.rev})\nReport: ${b.report_id}\n\n${b.summary}\n\nGenerated: ${new Date().toISOString()}`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download=`ThermoIQ_${b.tag}_${Date.now()}.txt`;a.click();
  toast('Report exported');
}

/* ════════════════════════════════════════════
   MANUFACTURERS
════════════════════════════════════════════ */
let mfrFilter='all';
function buildMfrDash(){buildKPIs();buildHM();buildFleet();buildSellCards();buildEvents();buildFilters();}
function buildFilters(){
  const mfrs=['All',...new Set(BIKES.map(b=>b.mfr))];
  document.getElementById('mfr-filter-bar').innerHTML=mfrs.map((m,i)=>`<div class="fb${i===0?' on':''}" onclick="setMfrFilter('${m==='All'?'all':m}',this)">${m}</div>`).join('');
}
function setMfrFilter(f,btn){mfrFilter=f;document.querySelectorAll('.fb').forEach(b=>b.classList.remove('on'));btn.classList.add('on');buildHM();buildFleet();document.getElementById('mfr-sub').textContent=(f==='all'?'All manufacturers':f)+' · Stage 12 · Live';}
function buildKPIs(){
  const bikes=mfrFilter==='all'?BIKES:BIKES.filter(b=>b.mfr===mfrFilter);
  const pass=bikes.filter(b=>b.comp==='PASS').length,fail=bikes.filter(b=>b.comp==='FAIL').length,pend=bikes.filter(b=>b.comp==='PEND').length;
  const kpis=[
    {v:bikes.length,l:'Bikes registered',t:'',c:'var(--white)'},
    {v:pass,l:'PASS compliance',t:'↑ +2 vs yesterday',c:'var(--green)',tc:'tr-up'},
    {v:fail,l:'FAIL — flagged',t:'Action required',c:'var(--red)',tc:'tr-dn'},
    {v:pend,l:'Pending review',t:'3 in queue',c:'var(--amber)',tc:'tr-fl'},
    {v:bikes.reduce((a,b)=>a+b.stageWins,0),l:'Stage wins season',t:'',c:'var(--gold)'},
  ];
  document.getElementById('kpi-row').innerHTML=kpis.map(k=>`<div class="kpi"><div class="kpi-val" style="color:${k.c}">${k.v}</div><div class="kpi-label">${k.l}</div>${k.t?`<div class="kpi-trend ${k.tc||''}">${k.t}</div>`:''}</div>`).join('');
}
function buildHM(){
  const bikes=mfrFilter==='all'?BIKES:BIKES.filter(b=>b.mfr===mfrFilter);
  document.getElementById('hm-grid').innerHTML=bikes.map(b=>{
    const cls=b.comp==='PASS'?'hm-pass':b.comp==='FAIL'?'hm-fail':'hm-pend';
    const col=b.comp==='PASS'?'var(--green)':b.comp==='FAIL'?'var(--red)':'var(--amber)';
    return `<div class="hm-cell ${cls}" onclick="loadTag('${b.tag}');topNav('uci')">
      <div class="hm-id">${b.tag.slice(0,10)}…</div>
      <div class="hm-model">${b.mfr}</div>
      <div class="hm-rider">${b.rider}</div>
      <div class="hm-status" style="color:${col}">${b.comp==='PEND'?'PENDING':b.comp} · ${b.stageWins}W</div>
    </div>`;
  }).join('');
}
function buildFleet(){
  const bikes=mfrFilter==='all'?BIKES:BIKES.filter(b=>b.mfr===mfrFilter);
  document.getElementById('fleet-tbody').innerHTML=bikes.map(b=>{
    const cls=b.comp==='PASS'?'b-pass':b.comp==='FAIL'?'b-fail':'b-pend';
    const scoreCol=b.equipScore>=90?'var(--green)':b.equipScore>=70?'var(--gold)':'var(--red)';
    return `<tr>
      <td class="td-id">${b.tag.slice(0,10)}…</td>
      <td><div class="td-model">${b.mfr} · ${b.model}</div></td>
      <td style="color:var(--white3);font-size:11px">${b.team}</td>
      <td style="font-family:var(--fd);font-size:13px">${b.rider}</td>
      <td><span class="badge ${cls}">${b.comp==='PEND'?'PENDING':b.comp}</span></td>
      <td style="font-family:var(--fd);font-size:16px;font-weight:700;color:var(--gold)">${b.stageWins}</td>
      <td style="font-family:var(--fd);font-size:16px;font-weight:700;color:${scoreCol}">${b.equipScore}</td>
      <td><button class="td-btn" onclick="loadTag('${b.tag}');topNav('uci')">Inspect</button></td>
    </tr>`;
  }).join('');
}
function buildSellCards(){
  document.getElementById('sell-grid').innerHTML=SELL_CARDS.map(s=>`
    <div class="sell-card" onclick="toast('Contact us: ${s.title} — ${s.price}')">
      <div class="sc-icon">${s.icon}</div>
      <div class="sc-title">${s.title}</div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-price">${s.price}</div>
      <div class="sc-price-label">${s.label}</div>
    </div>`).join('');
}
function buildEvents(){
  document.getElementById('evt-list').innerHTML=`<div class="evt-title">Compliance events — Stage 12</div>`+
  BIKES.map(b=>{
    const col=b.comp==='PASS'?'var(--green)':b.comp==='FAIL'?'var(--red)':'var(--amber)';
    return `<div class="evt-item">
      <div class="evt-dot" style="background:${col}"></div>
      <div>
        <div class="evt-text">${b.tag.slice(0,14)} · ${b.rider} · ${b.model} — <strong style="color:${col}">${b.comp==='PEND'?'PENDING':b.comp}</strong></div>
        <div class="evt-time">Reviewer: ${b.rev} · ${b.summary.slice(0,55)}…</div>
      </div>
    </div>`;
  }).join('');
}
function exportCSV(){
  const bikes=mfrFilter==='all'?BIKES:BIKES.filter(b=>b.mfr===mfrFilter);
  const csv=['Tag ID,Manufacturer,Model,Team,Rider,Compliance,Stage Wins,Equip Score,Summary']
    .concat(bikes.map(b=>`${b.tag},${b.mfr},${b.model},${b.team},${b.rider},${b.comp},${b.stageWins},${b.equipScore},"${b.summary}"`))
    .join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`ThermoIQ_Fleet_${Date.now()}.csv`;a.click();
  toast('CSV exported');
}

/* ════════════════════════════════════════════
   LIVE UPDATES
════════════════════════════════════════════ */
let elapsed=4*3600+22*60+18, kmToGo=36, breakGap=74;
function startLiveClock(){
  setInterval(()=>{
    elapsed++;
    const h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60),s=elapsed%60;
    document.getElementById('clock').textContent=`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },1000);
}
function startLiveUpdates(){
  setInterval(()=>{
    // km to go
    if(kmToGo>0.5)kmToGo=Math.max(0,kmToGo-0.08);
    const rtbKm=document.getElementById('rtb-km');
    if(rtbKm)rtbKm.textContent=kmToGo.toFixed(1);
    // break gap fluctuates
    breakGap+=Math.round((Math.random()-0.6)*3);
    breakGap=Math.max(0,Math.min(200,breakGap));
    const rtbGap=document.getElementById('rtb-gap');
    if(rtbGap)rtbGap.textContent=`${Math.floor(breakGap/60)}:${String(breakGap%60).padStart(2,'0')}`;
    // speed
    const rtbSpd=document.getElementById('rtb-speed');
    if(rtbSpd)rtbSpd.textContent=(41+Math.random()*6).toFixed(1);
    // rider dots move
    GC.forEach(r=>{r.kmPos=Math.min(178,r.kmPos+0.04+(Math.random()*0.02));});
    buildRiderDots();
  },500);
}
function startFeedUpdater(){
  const newPosts=[
    {handle:'@TdFRealtime',avatar:'T',color:'#f07820',src:'tw',time:'just now',text:'🚨 Km 142 — Pogačar accelerates! Vingegaard responds immediately. The yellow jersey showdown is ON.',tags:['#TdF2026'],likes:'8.1k',emoji:'🔥'},
    {handle:'@ColnagoOfficial',avatar:'C',color:'#c00020',src:'ig',time:'1m',text:'📸 Our V4Rs at the front of the race. Zero compliance issues. Maximum performance. #Colnago #V4Rs #TdF2026',tags:['#Colnago','#V4Rs'],likes:'22k',emoji:'🚲'},
  ];
  let idx=0;
  setInterval(()=>{
    const post=newPosts[idx%newPosts.length];idx++;
    const feed=document.getElementById('social-feed-list');
    if(!feed)return;
    const div=document.createElement('div');div.className='sf-item';
    div.innerHTML=`<div class="sf-meta"><div class="sf-avatar" style="background:${post.color}">${post.avatar}</div><div class="sf-handle">${post.handle}</div><div class="sf-time">${post.time}</div><div class="sf-source ${post.src==='ig'?'sf-src-ig':'sf-src-tw'}">${post.src==='ig'?'IG':'TW'}</div></div><div class="sf-text">${post.text}</div><div class="sf-tags">${post.tags.map(t=>`<span class="sf-tag">${t}</span>`).join('')}</div><div class="sf-likes">❤ ${post.likes} · ${post.emoji}</div>`;
    feed.insertBefore(div,feed.firstChild);
    if(feed.children.length>12)feed.removeChild(feed.lastChild);
  },8000);
}

/* ════════════════════════════════════════════
   UTILS
════════════════════════════════════════════ */
function toast(msg,ms=2200){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),ms);}
