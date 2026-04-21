

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://linrusgrvszlgwwgddve.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9Xys4snk8mXI29JnX_Dm2g_zeqSbnqZ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const EVALUATOR_MODE = true;

const APP_STATE = {
  tab: 'race',
  currentUser: null,
  currentProfile: null,
  currentEvent: null,
  currentBike: null,
  inspectionDraft: null,
  stage: { elapsed: 4 * 3600 + 22 * 60 + 18, kmToGo: 36, avgSpeed: 44.2, gapSec: 74, kmMarker: 142 }
};

const GC = [
  {rank:1,bib:11,name:'T. Pogačar',team:'UAE Team Emirates',gap:'0:00',bike:'Colnago V5Rs',wheels:'ENVE SES 4.5',status:'Attacking on final climb',power:'6.4 w/kg',hr:'174 bpm',cadence:'91 rpm',tags:['Race leader','Climbing setup','Stable gap']},
  {rank:2,bib:21,name:'J. Vingegaard',team:'Visma | Lease a Bike',gap:'+0:18',bike:'Cervelo R5',wheels:'Reserve 40/44',status:'Following first GC accelerations',power:'6.2 w/kg',hr:'171 bpm',cadence:'88 rpm',tags:['Low-drag position','Measured pacing']},
  {rank:3,bib:35,name:'R. Evenepoel',team:'Soudal Quick-Step',gap:'+0:42',bike:'Specialized Tarmac SL8',wheels:'Roval Rapide',status:'Bridging to front selection',power:'6.1 w/kg',hr:'176 bpm',cadence:'93 rpm',tags:['TT engine','Fast descent']},
  {rank:4,bib:7,name:'P. Roglič',team:'BORA-hansgrohe',gap:'+0:56',bike:'Specialized Tarmac SL8',wheels:'Roval CLX II',status:'Riding defensively',power:'5.9 w/kg',hr:'168 bpm',cadence:'87 rpm',tags:['Explosive finish','Compact setup']},
  {rank:5,bib:62,name:'C. Rodríguez',team:'INEOS Grenadiers',gap:'+1:13',bike:'Pinarello Dogma F',wheels:'Princeton Peak',status:'Holding GC group',power:'5.8 w/kg',hr:'167 bpm',cadence:'89 rpm',tags:['Smooth cadence','Controlled effort']}
];
const PRED_FACTORS = ['final climb suits punchy climber','UAE pacing dominance','recent stage win form','equipment optimized for high gradient'];
const EQUIPMENT = [
  {brand:'Colnago',wins:8,detail:'Highest mountain-stage conversion'},
  {brand:'Specialized',wins:6,detail:'Best aero-climb balance'},
  {brand:'Cervélo',wins:5,detail:'Consistent across mixed stages'},
  {brand:'Pinarello',wins:4,detail:'Reliable on technical descents'}
];
const SOCIAL_POSTS = [
  {src:'Race Radio',msg:'Breakaway gap drops below 1:15 as UAE increase tempo on lower slopes.'},
  {src:'Moto 2',msg:'Front selection forming behind Pogačar, Vingegaard and Evenepoel.'},
  {src:'Tech Feed',msg:'Officials report stable transponder reads at intermediate timing point.'},
  {src:'Fan Cam',msg:'Montserrat crowds are 5 deep near the final kilometer.'}
];
const WHY_WON = {
  title: 'Why the model likes Pogačar',
  body: 'The route profile compresses the field late, rewarding a rider who can tolerate repeated surges and still finish explosively. Current pacing data and course history both point to UAE controlling the finale.',
  bullets: ['Best climbing efficiency in last 3 mountain stages','Bike + wheel setup favors steep sustained grades','Strongest team support entering final 20 km']
};
const EVENTS = [
  {name:'Volta Catalunya', stages:['Stage 12','Stage 13','Stage 14'], location:'Girona → Montserrat'},
  {name:'Tour de Romandie', stages:['Stage 2','Stage 3','Stage 4'], location:'Sion → Thyon 2000'}
];
const BIKES = [
  {tagId:'044B536AD71F90', rider:'T. Pogačar', bib:'11', team:'UAE Team Emirates', bikeBrand:'Colnago', frameModel:'V5Rs', frameSerial:'COL-V5R-2026-011', wheels:'ENVE SES 4.5', groupset:'Shimano Dura-Ace', transponder:'TRN-33011', status:'Active'},
  {tagId:'113C8821AB4F72', rider:'J. Vingegaard', bib:'21', team:'Visma | Lease a Bike', bikeBrand:'Cervélo', frameModel:'R5', frameSerial:'CRV-R5-2026-021', wheels:'Reserve 40|44', groupset:'Shimano Dura-Ace', transponder:'TRN-33021', status:'Active'},
  {tagId:'9F22C771A08D11', rider:'R. Evenepoel', bib:'35', team:'Soudal Quick-Step', bikeBrand:'Specialized', frameModel:'Tarmac SL8', frameSerial:'SPZ-SL8-2026-035', wheels:'Roval Rapide', groupset:'SRAM Red', transponder:'TRN-33035', status:'Active'},
  {tagId:'A17D33BC09FF28', rider:'P. Roglič', bib:'7', team:'BORA-hansgrohe', bikeBrand:'Specialized', frameModel:'Tarmac SL8', frameSerial:'SPZ-SL8-2026-007', wheels:'Roval CLX II', groupset:'Shimano Dura-Ace', transponder:'TRN-33007', status:'Active'},
  {tagId:'8811440AFBC812', rider:'C. Rodríguez', bib:'62', team:'INEOS Grenadiers', bikeBrand:'Pinarello', frameModel:'Dogma F', frameSerial:'PIN-DGF-2026-062', wheels:'Princeton Peak', groupset:'Shimano Dura-Ace', transponder:'TRN-33062', status:'Flagged'}
];
const CHECK_SECTIONS = [
  {section:'Identity', items:[{code:'bike_match', label:'Bike matches rider'},{code:'tag_readable', label:'Tag readable'},{code:'transponder_match', label:'Transponder matches record'}]},
  {section:'Equipment', items:[{code:'frame_approved', label:'Frame approved'},{code:'wheels_approved', label:'Wheels approved'},{code:'groupset_compliant', label:'Groupset compliant'}]},
  {section:'Regulations', items:[{code:'weight_compliant', label:'Weight compliant'},{code:'dimensions_compliant', label:'Dimensions compliant'},{code:'no_illegal_mods', label:'No illegal modifications'}]},
  {section:'Verification', items:[{code:'photo_captured', label:'Photo captured'},{code:'notes_added', label:'Notes added'}]}
];

function el(id) { return document.getElementById(id); }
function toast(msg, ms = 2600) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), ms);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
function val(id) { const node = el(id); return node ? node.value : ''; }
function fmtDateTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso || ''; } }
function secondsToClock(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
function secondsToGap(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
function resultClass(opt) {
  return opt === 'PASS' ? 'pass' : opt === 'WARNING' ? 'warning' : opt === 'FAIL' ? 'fail' : 'skip';
}
function deriveOverallResult(checks) {
  if ((checks || []).some(c => c.result === 'FAIL')) return 'FAIL';
  if ((checks || []).some(c => c.result === 'WARNING')) return 'WARNING';
  return 'PASS';
}
function setSessionBadge(text) {
  const badge = el('session-badge');
  if (badge) badge.textContent = text;
}
function setAdminTab() {
  const btn = el('admin-tab-btn');
  if (btn) btn.style.display = APP_STATE.currentProfile?.role === 'admin' ? 'inline-flex' : 'none';
}
function setText(id, value) { const node = el(id); if (node) node.textContent = value; }
function setHtml(id, value) { const node = el(id); if (node) node.innerHTML = value; }
function showOnlyScreen(screenId) {
  document.querySelectorAll('[data-screen]').forEach(node => node.classList.toggle('active', node.dataset.screen === screenId));
  const target = el(`screen-${screenId}`) || el(screenId);
  if (target) {
    document.querySelectorAll('.screen').forEach(node => node.classList.remove('active'));
    target.classList.add('active');
  }
}
function goToScreen(name) {
  showOnlyScreen(name);
}

async function ensureProfile(nameFallback = 'Official') {
  if (!APP_STATE.currentUser?.id) throw new Error('No authenticated user');
  const userId = APP_STATE.currentUser.id;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  APP_STATE.currentProfile = profile || {
    id: userId,
    full_name: nameFallback,
    role: 'official'
  };

  setSessionBadge(APP_STATE.currentUser.email || 'Evaluator');
  setAdminTab();
  return APP_STATE.currentProfile;
}

async function restoreSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!data.session?.user) {
      APP_STATE.currentUser = null;
      APP_STATE.currentProfile = null;
      setSessionBadge('Guest');
      setAdminTab();
      goToScreen('login');
      return;
    }

    APP_STATE.currentUser = data.session.user;
    await ensureProfile(data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Evaluator');
    goToScreen('event');
    await renderHistory();
  } catch (err) {
    console.error('restoreSession failed', err);
    APP_STATE.currentUser = null;
    APP_STATE.currentProfile = null;
    setSessionBadge('Guest');
    setAdminTab();
    goToScreen('login');
    toast('Session restore failed');
  }
}

window.signInUser = async function() {
  try {
    const email = val('login-email').trim();
    const password = val('login-password').trim();
    const btn = el('btn-signin');
    const original = btn?.textContent || 'Sign In';

    if (!email || !password) {
      toast('Enter email and password');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in...';
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Sign-in failed');

    APP_STATE.currentUser = data.user;
    await ensureProfile(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Evaluator');
    goToScreen('event');
    await renderHistory();
    toast('Signed in');

    if (btn) {
      btn.disabled = false;
      btn.textContent = original;
    }
  } catch (err) {
    console.error('signInUser failed', err);
    const btn = el('btn-signin');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
    toast(err.message || 'Sign-in failed');
  }
};

window.signUpUser = async function() {
  toast('Evaluator build: signup disabled');
};

window.sendPasswordReset = async function() {
  toast('Evaluator build: password reset disabled');
};

async function signOutUser() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('signOut warning', err);
  }
  APP_STATE.currentUser = null;
  APP_STATE.currentProfile = null;
  APP_STATE.currentBike = null;
  APP_STATE.inspectionDraft = null;
  setSessionBadge('Guest');
  setAdminTab();
  goToScreen('login');
}
window.signOutUser = signOutUser;

window.topNav = function(name) {
  if (name === 'uci' && !APP_STATE.currentUser) {
    APP_STATE.tab = 'uci';
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'uci'));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === 'pane-uci'));
    goToScreen('login');
    toast('Please sign in');
    return;
  }

  if (name === 'admin' && APP_STATE.currentProfile?.role !== 'admin') {
    toast('Admin access only');
    return;
  }

  APP_STATE.tab = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + name));

  const brandSub = el('brand-sub');
  if (brandSub) {
    brandSub.textContent = name === 'race' ? 'Race Intelligence' : name === 'fan' ? 'Fan Zone' : name === 'uci' ? 'UCI Officials' : 'Admin';
  }

  if (name === 'admin') loadAdminDashboard();
};

function buildGCList() {
  setHtml('gc-list', GC.map(r => `
    <div class="gc-row" data-bib="${r.bib}">
      <div class="gc-rank">${r.rank}</div>
      <div><div class="gc-name">${escapeHtml(r.name)}</div><div class="gc-team">${escapeHtml(r.team)}</div></div>
      <div class="gc-gap">${escapeHtml(r.gap)}</div>
    </div>`).join(''));
  document.querySelectorAll('.gc-row').forEach(row => {
    row.addEventListener('click', () => showRider(Number(row.dataset.bib)));
  });
}
function buildRiderDots() {
  setHtml('rider-dots', GC.map((r, i) => `<circle cx="${220 - (i * 18)}" cy="${52 - (i * 4)}" r="3.6" fill="${i===0 ? '#f6c453' : '#69c2ff'}"></circle>`).join(''));
}
function showRider(bib) {
  const rider = GC.find(r => r.bib === bib);
  if (!rider) return;
  setHtml('rider-spot', `
    <div class="rider-grid">
      <div>
        <div class="label">Rider</div>
        <div class="value">${escapeHtml(rider.name)}</div>
      </div>
      <div>
        <div class="label">Team</div>
        <div class="value">${escapeHtml(rider.team)}</div>
      </div>
      <div>
        <div class="label">Bike</div>
        <div class="value">${escapeHtml(rider.bike)}</div>
      </div>
      <div>
        <div class="label">Wheels</div>
        <div class="value">${escapeHtml(rider.wheels)}</div>
      </div>
      <div>
        <div class="label">Status</div>
        <div class="value">${escapeHtml(rider.status)}</div>
      </div>
      <div>
        <div class="label">Power</div>
        <div class="value">${escapeHtml(rider.power)}</div>
      </div>
    </div>
    <div class="tag-list">${rider.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
  `);
}
function buildFanZone() {
  setHtml('social-feed', SOCIAL_POSTS.map(p => `<div class="feed-item"><strong>${escapeHtml(p.src)}:</strong> ${escapeHtml(p.msg)}</div>`).join(''));
  setHtml('pred-factors', PRED_FACTORS.map(f => `<li>${escapeHtml(f)}</li>`).join(''));
  setHtml('equipment-table', EQUIPMENT.map(e => `<tr><td>${escapeHtml(e.brand)}</td><td>${e.wins}</td><td>${escapeHtml(e.detail)}</td></tr>`).join(''));
  setText('why-title', WHY_WON.title);
  setText('why-body', WHY_WON.body);
  setHtml('why-bullets', WHY_WON.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join(''));
}
function initEventOptions() {
  const eventSel = el('event-select');
  const stageSel = el('stage-select');
  if (!eventSel || !stageSel) return;

  eventSel.innerHTML = EVENTS.map((e, i) => `<option value="${i}">${escapeHtml(e.name)} — ${escapeHtml(e.location)}</option>`).join('');

  const loadStages = () => {
    const event = EVENTS[Number(eventSel.value || 0)] || EVENTS[0];
    APP_STATE.currentEvent = event;
    stageSel.innerHTML = event.stages.map((s, i) => `<option value="${i}">${escapeHtml(s)}</option>`).join('');
  };

  eventSel.addEventListener('change', loadStages);
  loadStages();
}
function renderLookupResults() {
  setHtml('bike-results', BIKES.map(b => `
    <button class="lookup-row" data-tag="${escapeAttr(b.tagId)}">
      <div><strong>${escapeHtml(b.rider)}</strong> <span>#${escapeHtml(b.bib)}</span></div>
      <div>${escapeHtml(b.bikeBrand)} ${escapeHtml(b.frameModel)} · ${escapeHtml(b.status)}</div>
    </button>`).join(''));

  document.querySelectorAll('.lookup-row').forEach(btn => {
    btn.addEventListener('click', () => loadBikeByTag(btn.dataset.tag));
  });
}
function loadBikeByTag(tagId) {
  const bike = BIKES.find(b => b.tagId === tagId || b.tagId.toLowerCase() === String(tagId).toLowerCase());
  if (!bike) {
    toast('Bike not found');
    return;
  }
  APP_STATE.currentBike = bike;
  setHtml('bike-profile', `
    <div class="detail-grid">
      <div><span class="label">Rider</span><span class="value">${escapeHtml(bike.rider)}</span></div>
      <div><span class="label">Bib</span><span class="value">${escapeHtml(bike.bib)}</span></div>
      <div><span class="label">Team</span><span class="value">${escapeHtml(bike.team)}</span></div>
      <div><span class="label">Bike</span><span class="value">${escapeHtml(bike.bikeBrand)} ${escapeHtml(bike.frameModel)}</span></div>
      <div><span class="label">Frame serial</span><span class="value">${escapeHtml(bike.frameSerial)}</span></div>
      <div><span class="label">Transponder</span><span class="value">${escapeHtml(bike.transponder)}</span></div>
      <div><span class="label">Wheels</span><span class="value">${escapeHtml(bike.wheels)}</span></div>
      <div><span class="label">Status</span><span class="value">${escapeHtml(bike.status)}</span></div>
    </div>
  `);
  buildChecklist();
  goToScreen('profile');
}
window.loadBikeByTag = loadBikeByTag;

function buildChecklist() {
  const checks = [];
  setHtml('checklist-sections', CHECK_SECTIONS.map(section => `
    <div class="check-section">
      <h3>${escapeHtml(section.section)}</h3>
      ${section.items.map(item => {
        checks.push(item.code);
        return `
          <div class="check-item" data-code="${escapeAttr(item.code)}">
            <div class="check-label">${escapeHtml(item.label)}</div>
            <div class="check-actions">
              <button type="button" data-result="PASS">PASS</button>
              <button type="button" data-result="WARNING">WARNING</button>
              <button type="button" data-result="FAIL">FAIL</button>
              <button type="button" data-result="SKIP">SKIP</button>
            </div>
          </div>`;
      }).join('')}
    </div>`).join(''));

  APP_STATE.inspectionDraft = {
    checks: checks.map(code => ({ code, result: 'SKIP', note: '' })),
    summary: '',
    overall_result: 'PASS',
    created_at: new Date().toISOString()
  };

  document.querySelectorAll('.check-item button').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.check-item');
      const code = wrap.dataset.code;
      const result = btn.dataset.result;
      APP_STATE.inspectionDraft.checks = APP_STATE.inspectionDraft.checks.map(c => c.code === code ? { ...c, result } : c);
      wrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      APP_STATE.inspectionDraft.overall_result = deriveOverallResult(APP_STATE.inspectionDraft.checks);
      renderSummary();
    });
  });
}
function renderSummary() {
  if (!APP_STATE.inspectionDraft || !APP_STATE.currentBike) return;
  const summaryText = el('inspection-summary');
  if (summaryText) APP_STATE.inspectionDraft.summary = summaryText.value || '';
  APP_STATE.inspectionDraft.overall_result = deriveOverallResult(APP_STATE.inspectionDraft.checks);
  setHtml('summary-panel', `
    <div class="summary-card">
      <div><strong>Rider:</strong> ${escapeHtml(APP_STATE.currentBike.rider)}</div>
      <div><strong>Bike:</strong> ${escapeHtml(APP_STATE.currentBike.bikeBrand)} ${escapeHtml(APP_STATE.currentBike.frameModel)}</div>
      <div><strong>Overall:</strong> <span class="${resultClass(APP_STATE.inspectionDraft.overall_result)}">${escapeHtml(APP_STATE.inspectionDraft.overall_result)}</span></div>
      <div><strong>Checks completed:</strong> ${APP_STATE.inspectionDraft.checks.length}</div>
    </div>
  `);
}
async function saveInspection() {
  if (!APP_STATE.currentUser) {
    toast('Please sign in');
    goToScreen('login');
    return;
  }
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Load a bike and complete the checklist first');
    return;
  }

  const payload = {
    user_id: APP_STATE.currentUser.id,
    bike_tag: APP_STATE.currentBike.tagId,
    rider: APP_STATE.currentBike.rider,
    bib: APP_STATE.currentBike.bib,
    team: APP_STATE.currentBike.team,
    bike_brand: APP_STATE.currentBike.bikeBrand,
    frame_model: APP_STATE.currentBike.frameModel,
    frame_serial: APP_STATE.currentBike.frameSerial,
    transponder: APP_STATE.currentBike.transponder,
    overall_result: APP_STATE.inspectionDraft.overall_result,
    checks: APP_STATE.inspectionDraft.checks,
    summary: APP_STATE.inspectionDraft.summary || '',
    event_name: APP_STATE.currentEvent?.name || '',
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('inspections').insert(payload);
    if (error) throw error;
    toast('Inspection saved');
    await renderHistory();
  } catch (err) {
    console.error('saveInspection failed', err);
    toast(err.message || 'Save failed');
  }
}
window.saveInspection = saveInspection;

function exportInspectionJson() {
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Nothing to export yet');
    return;
  }
  const payload = {
    bike: APP_STATE.currentBike,
    inspection: {
      ...APP_STATE.inspectionDraft,
      summary: el('inspection-summary')?.value || APP_STATE.inspectionDraft.summary || ''
    },
    exported_at: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inspection_${APP_STATE.currentBike.bib || 'bike'}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('JSON exported');
}
window.exportInspectionJson = exportInspectionJson;

async function renderHistory() {
  const host = el('history-list');
  if (!host || !APP_STATE.currentUser) {
    if (host) host.innerHTML = '';
    return;
  }
  try {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    host.innerHTML = (data || []).map(row => `
      <div class="history-row">
        <div><strong>${escapeHtml(row.rider || '')}</strong> #${escapeHtml(row.bib || '')}</div>
        <div>${escapeHtml(row.bike_brand || '')} ${escapeHtml(row.frame_model || '')}</div>
        <div>${escapeHtml(row.overall_result || '')}</div>
        <div>${escapeHtml(fmtDateTime(row.created_at))}</div>
      </div>`).join('') || '<div class="history-empty">No inspections yet</div>';
  } catch (err) {
    console.warn('renderHistory failed', err);
    host.innerHTML = '<div class="history-empty">History unavailable</div>';
  }
}
async function loadAdminDashboard() {
  const host = el('admin-panel');
  if (!host) return;
  host.innerHTML = `<div class="admin-card">Evaluator build active${APP_STATE.currentProfile?.role === 'admin' ? ' · admin mode' : ''}</div>`;
}

function startLiveClock() {
  window.setInterval(() => {
    APP_STATE.stage.elapsed += 1;
    setText('clock-badge', secondsToClock(APP_STATE.stage.elapsed));
    setText('rtb-gap', secondsToGap(APP_STATE.stage.gapSec));
  }, 1000);
}
function startLiveUpdates() {}
function startFeedUpdater() {}

function bindUi() {
  el('btn-signin')?.addEventListener('click', window.signInUser);
  el('btn-create')?.addEventListener('click', window.signUpUser);
  el('btn-forgot')?.addEventListener('click', window.sendPasswordReset);
  el('btn-signout')?.addEventListener('click', signOutUser);
  el('btn-start-inspection')?.addEventListener('click', () => {
    if (!APP_STATE.currentUser) {
      toast('Please sign in');
      goToScreen('login');
      return;
    }
    goToScreen('scanner');
  });
  el('btn-scan')?.addEventListener('click', () => {
    const manual = val('tag-input').trim();
    if (manual) {
      loadBikeByTag(manual);
      return;
    }
    if (BIKES[0]) loadBikeByTag(BIKES[0].tagId);
  });
  el('btn-to-checklist')?.addEventListener('click', () => {
    if (!APP_STATE.currentBike) return toast('Load a bike first');
    goToScreen('checklist');
  });
  el('btn-to-summary')?.addEventListener('click', () => {
    if (!APP_STATE.inspectionDraft) return toast('Complete the checklist first');
    renderSummary();
    goToScreen('summary');
  });
  el('inspection-summary')?.addEventListener('input', renderSummary);
  el('btn-save')?.addEventListener('click', saveInspection);
  el('btn-export')?.addEventListener('click', exportInspectionJson);

  if (EVALUATOR_MODE) {
    const createBtn = el('btn-create');
    const forgotBtn = el('btn-forgot');
    if (createBtn) {
      createBtn.style.display = 'none';
      createBtn.disabled = true;
    }
    if (forgotBtn) {
      forgotBtn.style.display = 'none';
      forgotBtn.disabled = true;
    }
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === 'SIGNED_OUT' || !session?.user) {
        APP_STATE.currentUser = null;
        APP_STATE.currentProfile = null;
        setSessionBadge('Guest');
        setAdminTab();
        return;
      }
      APP_STATE.currentUser = session.user;
      if (!APP_STATE.currentProfile) {
        await ensureProfile(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Evaluator');
      }
      setSessionBadge(session.user.email || 'Evaluator');
    } catch (err) {
      console.warn('auth state handler failed', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  buildGCList();
  buildRiderDots();
  buildFanZone();
  initEventOptions();
  bindUi();
  renderLookupResults();
  goToScreen('login');
  setText('clock-badge', secondsToClock(APP_STATE.stage.elapsed));
  setText('rtb-gap', secondsToGap(APP_STATE.stage.gapSec));
  await restoreSession();
  await renderHistory();
  startLiveClock();
  startLiveUpdates();
  startFeedUpdater();
});
