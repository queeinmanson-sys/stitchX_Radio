// --- Socket.IO real-time integration ---
let socket = null;
let lastFanZoneUpdate = 0;
let lastLiveRaceUpdate = 0;
let liveRaceUpdates = [];
let liveRacePollingHandle = null;
let currentRaceId = "race_2026_stage_1";

function initRealtime() {
  if (socket || typeof window.io === 'undefined') return;
  socket = window.io(BACKEND_URL);

  socket.on('connect', () => {
    // console.log('Socket.IO connected');
    fetchRaceUpdates(); // Optional: refresh on reconnect
  });

  socket.on('fanzone:update', (post) => {
    if (!post || !post.id) return;
    if (Date.now() - lastFanZoneUpdate < 500) return;
    lastFanZoneUpdate = Date.now();
    // Prepend new post if not already present
    if (!fanZonePosts.find(p => p.id === post.id)) {
      fanZonePosts.unshift(post);
      renderFanZonePosts();
    }
  });

  socket.on('liverace:update', (update) => {
    if (!update || !update.id) return;
    if (Date.now() - lastLiveRaceUpdate < 500) return;
    lastLiveRaceUpdate = Date.now();
    // Prepend new update if not already present
    if (!liveRaceUpdates.find(u => u.id === update.id)) {
      liveRaceUpdates.unshift(update);
      renderLiveRaceUpdates();
    }
  });

  socket.on('disconnect', () => {
    console.warn('Socket.IO disconnected');
  });
}
// --- Fan Zone post creation ---
async function createFanZonePost(postPayload) {
  const response = await fetch(`${BACKEND_URL}/api/fan-zone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postPayload)
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create fan post');
  }

  return data.post;
}

async function submitFanZonePost() {

  try {
    const titleEl = el('fan-post-title');
    const authorEl = el('fan-post-author');
    const categoryEl = el('fan-post-category');
    const bodyEl = el('fan-post-body');

    const titleInput = titleEl ? titleEl.value.trim() : '';
    const author_name = authorEl ? authorEl.value.trim() : '';
    const category = categoryEl ? categoryEl.value : 'general';
    const body = bodyEl ? bodyEl.value.trim() : '';

    if (!body) {
      toast('Body is required');
      bodyEl?.focus();
      return;
    }

    const title = titleInput || `Fan post · ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    await createFanZonePost({
      title,
      body,
      category,
      author_name,
      race_id: currentRaceId,
      is_featured: false,
      is_published: true
    });

    if (el('fan-post-title')) el('fan-post-title').value = '';
    if (el('fan-post-author')) el('fan-post-author').value = '';
    if (el('fan-post-body')) el('fan-post-body').value = '';

    toast('Fan post published');
    // No fetchFanZonePosts(); needed, Socket.IO handles update
  } catch (error) {
    console.error('submitFanZonePost error:', error);
    toast('Failed to publish post');
  }
}
// ===== Live Race state =====

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatUpdateTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function fetchRaceUpdates(raceId = currentRaceId) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/race-updates?race_id=${encodeURIComponent(raceId)}`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch race updates");
    }

    liveRaceUpdates = data.updates || [];
    renderLiveRaceUpdates();
  } catch (error) {
    console.error("Error fetching race updates:", error);
    renderLiveRaceError(error.message);
  }
}

function renderLiveRaceUpdates() {
  const container = document.getElementById("live-race-updates");
  if (!container) return;

  if (!liveRaceUpdates.length) {
    container.innerHTML = `
      <div class="empty-state">
        No live race updates yet.
      </div>
    `;
    return;
  }

  container.innerHTML = liveRaceUpdates.map((update) => {
    return `
      <div class="race-update-card">
        <div class="race-update-header">
          <div class="race-update-type">${escapeHtml(update.type || "general")}</div>
          <div class="race-update-time">${formatUpdateTime(update.timestamp)}</div>
        </div>
        <div class="race-update-title">${escapeHtml(update.title || "")}</div>
        <div class="race-update-message">${escapeHtml(update.message || "")}</div>
        <div class="race-update-meta">
          ${update.rider_name ? `<span>Rider: ${escapeHtml(update.rider_name)}</span>` : ""}
          ${update.team ? `<span>Team: ${escapeHtml(update.team)}</span>` : ""}
          ${update.km_to_go !== null && update.km_to_go !== undefined ? `<span>KM to go: ${escapeHtml(update.km_to_go)}</span>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function renderLiveRaceError(message) {
  const container = document.getElementById("live-race-updates");
  if (!container) return;
  container.innerHTML = `
    <div class="error-state">
      Failed to load live race updates: ${escapeHtml(message)}
    </div>
  `;
}

function startLiveRacePolling(raceId = currentRaceId) {
  stopLiveRacePolling();
  fetchRaceUpdates(raceId);
}

function stopLiveRacePolling() {
  if (liveRacePollingHandle) {
    clearInterval(liveRacePollingHandle);
    liveRacePollingHandle = null;
  }
}
// --- Backend URL and server status helpers ---
const BACKEND_URL = window.STITCHX_CONFIG?.BACKEND_URL || 'http://localhost:3000';
const INSPECTIONS_API_ENABLED = false;
window.SERVER_ONLINE = false;
window.setServerStatus = function(isOnline) {
  window.SERVER_ONLINE = !!isOnline;
  const pill = document.getElementById('server-status-pill');
  if (!pill) return;
  pill.textContent = isOnline ? 'Server Online' : 'Server Offline';
  pill.style.color = isOnline ? '#22c55e' : '#ef4444';
};
window.checkServerStatus = async function() {
    if (!INSPECTIONS_API_ENABLED) {
      window.setServerStatus(false);
      return;
    }
  try {
    const res = await fetch(`${BACKEND_URL}/inspections`, { method: 'GET' });
    window.setServerStatus(res.ok);
  } catch (err) {
    window.setServerStatus(false);
  }
};
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

const SOCIAL_POSTS = [
  {src:'Race Radio',msg:'Breakaway gap drops below 1:15 as UAE increase tempo on lower slopes.'},
  {src:'Moto 2',msg:'Front selection forming behind Pogačar, Vingegaard and Evenepoel.'},
  {src:'Tech Feed',msg:'Officials report stable transponder reads at intermediate timing point.'},
  {src:'Fan Cam',msg:'Montserrat crowds are 5 deep near the final kilometer.'}
];

function el(id) { return document.getElementById(id); }
function setText(id, value) { const node = el(id); if (node) node.textContent = value; }
function setHtml(id, value) { const node = el(id); if (node) node.innerHTML = value; }
function val(id) { const node = el(id); return node ? node.value : ''; }

function fmtDateTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso || ''; } }
function toast(msg, ms = 2400) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), ms);
}
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
function deriveOverallResult(checks) {
  if (checks.some(c => c.result === 'FAIL')) return 'FAIL';
  if (checks.some(c => c.result === 'WARNING')) return 'WARNING';
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

function enableEvaluatorMode() {
  APP_STATE.currentUser = { id: 'evaluator-local-user', email: 'evaluator@local' };
  APP_STATE.currentProfile = { id: 'evaluator-local-user', full_name: 'Evaluator', role: 'official' };
  setSessionBadge('Evaluator Mode');
  setAdminTab();
}

function setFlow(step) {
  ['login','event','scan','check','save'].forEach(name => {
    const node = el(`flow-${name}`);
    if (node) node.classList.toggle('active', name === step);
  });
}

function showScreen(name) {
  document.querySelectorAll('#pane-uci .screen').forEach(node => node.classList.remove('active'));
  const target = el(`screen-${name}`);
  if (target) target.classList.add('active');

  setFlow(name === 'profile' ? 'scan' : name);

  const titleMap = {
    login: ['Official Access', 'Evaluator mode ready'],
    event: ['Official Access', 'Select event details'],
    scan: ['Official Access', 'Scan or load a bike record'],
    profile: ['Bike Profile', 'Confirm rider and bike details'],
    check: ['Compliance Check', 'Complete all checklist items'],
    save: ['Inspection Summary', 'Save or export the inspection']
  };
  const [title, sub] = titleMap[name] || ['Official Access', ''];
  setText('uci-screen-title', title);
  setText('uci-screen-sub', sub);
}

window.topNav = function(name) {
  console.log('TOPNAV', name);

  APP_STATE.tab = name;

  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });

  document.querySelectorAll('.pane').forEach((p) => {
    const isActive = p.id === 'pane-' + name;
    p.classList.toggle('active', isActive);
    p.style.display = isActive ? 'grid' : 'none';
  });

  const brandSub = el('brand-sub');
  if (brandSub) {
    brandSub.textContent =
      name === 'race'
        ? 'Race Intelligence'
        : name === 'fan'
        ? 'Fan Zone'
        : name === 'uci'
        ? 'UCI Officials'
        : 'Admin';
  }

  if (name === 'race') {
    startLiveRacePolling();
  } else {
    stopLiveRacePolling();
  }

  if (name === 'fan' && typeof fetchFanZonePosts === 'function') {
    fetchFanZonePosts();
  }

  if (name === 'uci') {
    showScreen('event');
  }
};
let fanZonePosts = [];

async function fetchFanZonePosts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/fan-zone`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed');
    }

    fanZonePosts = data.posts || [];
    renderFanZonePosts();

  } catch (err) {
    console.error('Fan Zone error:', err);
  }
}

function renderFanZonePosts() {
  const container = document.getElementById('fan-zone-posts');
  if (!container) return;

  if (!fanZonePosts.length) {
    container.innerHTML = `<div class="empty-state">No posts yet.</div>`;
    return;
  }

  container.innerHTML = fanZonePosts.map(post => `
    <div class="fan-post-card">
      <div class="fan-post-title">${escapeHtml(post.title)}</div>
      <div class="fan-post-body">${escapeHtml(post.body)}</div>
      <div class="fan-post-meta">
        <span>${escapeHtml(post.author_name || 'Fan')}</span>
      </div>
    </div>
  `).join('');
}

function buildGCList() {
  setHtml('gc-list', GC.map(r => `
    <div class="gc-row" data-bib="${r.bib}">
      <div class="gc-rank">${r.rank}</div>
      <div><div class="gc-name">${escapeHtml(r.name)}</div><div class="gc-team">${escapeHtml(r.team)}</div></div>
      <div class="gc-gap">${escapeHtml(r.gap)}</div>
    </div>`).join(''));
  document.querySelectorAll('.gc-row').forEach(row => row.addEventListener('click', () => showRider(Number(row.dataset.bib))));
}
function buildRiderDots() {
  setHtml('rider-dots', GC.map((r, i) => `<circle cx="${220 - i*18}" cy="${52 - i*4}" r="3.6" fill="${i===0 ? '#f6c453' : '#69c2ff'}"></circle>`).join(''));
}
function showRider(bib) {
  const rider = GC.find(r => r.bib === bib);
  if (!rider) return;
  setHtml('rider-spot', `
    <div class="rider-grid">
      <div><div class="small">Rider</div><div class="pred-name">${escapeHtml(rider.name)}</div></div>
      <div><div class="small">Team</div><div>${escapeHtml(rider.team)}</div></div>
      <div><div class="small">Bike</div><div>${escapeHtml(rider.bike)}</div></div>
      <div><div class="small">Status</div><div>${escapeHtml(rider.status)}</div></div>
      <div><div class="small">Power</div><div>${escapeHtml(rider.power)}</div></div>
      <div><div class="small">Cadence</div><div>${escapeHtml(rider.cadence)}</div></div>
    </div>
  `);
}
function buildFanZone() {
  setHtml('pred-factors', SOCIAL_POSTS.slice(0, 2).map(p => `<span class="chip">${escapeHtml(p.src)}</span>`).join(''));
  setHtml('pick-row', GC.slice(0, 4).map(r => `<button class="btn" type="button" data-bib="${r.bib}">${escapeHtml(r.name)}</button>`).join(''));
  setHtml('social-feed-list', SOCIAL_POSTS.map(p => `<div class="feed-item"><strong>${escapeHtml(p.src)}:</strong> ${escapeHtml(p.msg)}</div>`).join(''));
  setHtml('why-card', `<div class="card-head"><h3>Why the model likes Pogačar</h3></div><div class="small">Current pacing data and course history both point to UAE controlling the finale.</div>`);
  setHtml('ew-grid', ['Colnago','Specialized','Cervélo','Pinarello'].map((brand,i) => `<div class="stat"><div class="stat-value">${8-i}</div><div class="stat-label">${escapeHtml(brand)}</div></div>`).join(''));
  document.querySelectorAll('#pick-row [data-bib]').forEach(btn => btn.addEventListener('click', () => showRider(Number(btn.dataset.bib))));
}

function initEventOptions() {
  const eventSel = el('event-name');
  const stageSel = el('event-stage');
  if (!eventSel || !stageSel) return;
  eventSel.innerHTML = EVENTS.map((e, i) => `<option value="${i}">${escapeHtml(e.name)} — ${escapeHtml(e.location)}</option>`).join('');
  function loadStages() {
    const event = EVENTS[Number(eventSel.value || 0)] || EVENTS[0];
    APP_STATE.currentEvent = event;
    stageSel.innerHTML = event.stages.map((s, i) => `<option value="${i}">${escapeHtml(s)}</option>`).join('');
    if (el('event-location')) el('event-location').value = event.location;
  }
  eventSel.addEventListener('change', loadStages);
  loadStages();
  if (el('event-date')) el('event-date').value = new Date().toISOString().slice(0, 10);
}

function renderLookupResults(filter = '') {
  const q = filter.trim().toLowerCase();
  const rows = BIKES.filter(b => !q || [b.rider, b.team, b.bib, b.tagId].join(' ').toLowerCase().includes(q));
  setHtml('lookup-results', rows.map(b => `
    <button type="button" class="lookup-row" data-tag="${escapeHtml(b.tagId)}">
      <div><strong>${escapeHtml(b.rider)}</strong> <span>#${escapeHtml(b.bib)}</span></div>
      <div>${escapeHtml(b.bikeBrand)} ${escapeHtml(b.frameModel)} · ${escapeHtml(b.status)}</div>
    </button>`).join('') || '<div class="small">No matches</div>');
  document.querySelectorAll('#lookup-results .lookup-row').forEach(btn => btn.addEventListener('click', () => loadBikeByTag(btn.dataset.tag)));
}

function buildChecklist() {
  const checks = [];
  setHtml('checklist-root', CHECK_SECTIONS.map(section => `
    <div class="check-section">
      <h3>${escapeHtml(section.section)}</h3>
      ${section.items.map(item => {
        checks.push(item.code);
        return `<div class="check-item" data-code="${escapeHtml(item.code)}"><div class="check-label">${escapeHtml(item.label)}</div><div class="check-actions"><button type="button" data-result="PASS">PASS</button><button type="button" data-result="WARNING">WARNING</button><button type="button" data-result="FAIL">FAIL</button><button type="button" data-result="SKIP">SKIP</button></div></div>`;
      }).join('')}
    </div>`).join(''));

  APP_STATE.inspectionDraft = {
    checks: checks.map(code => ({ code, result: 'SKIP' })),
    notes: '',
    photoAdded: false,
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
    });
  });
}

function loadBikeByTag(tagId) {
  const bike = BIKES.find(b => b.tagId.toLowerCase() === String(tagId).trim().toLowerCase());
  if (!bike) {
    toast('Bike not found');
    return;
  }
  APP_STATE.currentBike = bike;
  setHtml('profile-card', `
    <div class="detail-grid">
      <div><span class="label">Rider</span><span class="value">${escapeHtml(bike.rider)}</span></div>
      <div><span class="label">Bib</span><span class="value">${escapeHtml(bike.bib)}</span></div>
      <div><span class="label">Team</span><span class="value">${escapeHtml(bike.team)}</span></div>
      <div><span class="label">Bike</span><span class="value">${escapeHtml(bike.bikeBrand)} ${escapeHtml(bike.frameModel)}</span></div>
      <div><span class="label">Frame serial</span><span class="value">${escapeHtml(bike.frameSerial)}</span></div>
      <div><span class="label">Transponder</span><span class="value">${escapeHtml(bike.transponder)}</span></div>
      <div><span class="label">Wheels</span><span class="value">${escapeHtml(bike.wheels)}</span></div>
      <div><span class="label">Status</span><span class="value">${escapeHtml(bike.status)}</span></div>
    </div>`);
  showScreen('profile');
}
window.loadBikeByTag = loadBikeByTag;

function renderSummary() {
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) return;
  const notes = val('inspection-notes');
  APP_STATE.inspectionDraft.notes = notes;
  APP_STATE.inspectionDraft.overall_result = deriveOverallResult(APP_STATE.inspectionDraft.checks);
  setHtml('summary-root', `
    <div class="summary-card">
      <div><strong>Rider:</strong> ${escapeHtml(APP_STATE.currentBike.rider)}</div>
      <div><strong>Bike:</strong> ${escapeHtml(APP_STATE.currentBike.bikeBrand)} ${escapeHtml(APP_STATE.currentBike.frameModel)}</div>
      <div><strong>Overall:</strong> ${escapeHtml(APP_STATE.inspectionDraft.overall_result)}</div>
      <div><strong>Notes:</strong> ${escapeHtml(APP_STATE.inspectionDraft.notes || 'None')}</div>
      <div><strong>Photo:</strong> ${APP_STATE.inspectionDraft.photoAdded ? 'Added' : 'Not added'}</div>
    </div>`);
}

function getLocalInspections() {
  try { return JSON.parse(localStorage.getItem('stitchx_inspections') || '[]'); } catch { return []; }
}
function setLocalInspections(rows) {
  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));
}
function renderHistoryLocal() {
  const rows = getLocalInspections();
  const q = val('history-search').trim().toLowerCase();
  const filter = val('history-filter') || 'ALL';
  const filtered = rows.filter(row => {
    const matchesFilter = filter === 'ALL' || row.overall_result === filter;
    const hay = [row.rider,row.team,row.bib,row.bike_tag].join(' ').toLowerCase();
    return matchesFilter && (!q || hay.includes(q));
  });
  setText('history-count', `${filtered.length} records`);
    setHtml('scan-hist-list', filtered.map(row => {
      const syncStatus = row._synced ? 'Synced' : 'Pending';
      const syncColor = row._synced ? '#4CAF50' : '#FFA500';
      return `
        <div class="history-row">
          <div><strong>${escapeHtml(row.rider)}</strong> #${escapeHtml(row.bib)}</div>
          <div>${escapeHtml(row.bike_brand)} ${escapeHtml(row.frame_model)}</div>
          <div>${escapeHtml(row.overall_result)}</div>
          <div>${escapeHtml(fmtDateTime(row.created_at))}</div>
          <div style="font-size:12px; color:${syncColor}; margin-top:4px;">
            ${syncStatus}
          </div>
        </div>
      `;
    }).join('') || '<div class="history-empty">No inspections yet</div>');
}

function saveInspection() {
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Complete the checklist first');
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
    overall_result: APP_STATE.inspectionDraft.overall_result,
    checks: APP_STATE.inspectionDraft.checks,
    notes: APP_STATE.inspectionDraft.notes || '',
    event_name: APP_STATE.currentEvent?.name || '',
    created_at: new Date().toISOString()
  };
  const rows = getLocalInspections();
  rows.unshift(payload);
  setLocalInspections(rows);
  renderHistoryLocal();
  toast('Inspection saved locally');

  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }
}

function exportInspectionJson() {
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Nothing to export yet');
    return;
  }
  const payload = {
    bike: APP_STATE.currentBike,
    inspection: APP_STATE.inspectionDraft,
    event: APP_STATE.currentEvent,
    exported_at: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inspection_${APP_STATE.currentBike.bib}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('JSON exported');
}

// --- Sync inspections to backend ---
window.syncInspections = async function() {
    if (!INSPECTIONS_API_ENABLED) return;
  let rows = [];

  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Could not read local inspections', err);
    return;
  }

  if (!rows.length) return;

  let syncedCount = 0;
  let hadFailure = false;

  for (const row of rows) {
    if (row._synced === true) continue;

    try {
      const res = await fetch(`${BACKEND_URL}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });

      if (!res.ok) {
        throw new Error(`Sync failed with status ${res.status}`);
      }

      row._synced = true;
      syncedCount += 1;
    } catch (err) {
      hadFailure = true;
      console.warn('Sync failed, will retry later', err);
    }
  }

  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));

  if (typeof renderHistoryLocal === 'function') {
    renderHistoryLocal();
  }

  window.setServerStatus(!hadFailure);

  if (typeof toast === 'function' && syncedCount > 0) {
    toast(`Synced ${syncedCount} inspection${syncedCount === 1 ? '' : 's'}`);
  }
};
window.hasPendingInspections = function() {
  try {
    const rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
    return rows.some(row => row._synced !== true);
  } catch {
    return false;
  }
};

window.setInterval(() => {
    if (!INSPECTIONS_API_ENABLED) return;
  if (window.hasPendingInspections()) {
    window.syncInspections();
  } else {
    window.checkServerStatus();
  }
}, 10000);
  window.checkServerStatus();

window.addEventListener('online', () => {
  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }
});

function bindUi() {
  el('btn-signin')?.addEventListener('click', () => { showScreen('event'); toast('Evaluator mode ready'); });
  el('btn-create')?.addEventListener('click', () => toast('Signup disabled in evaluator build'));
  el('btn-forgot')?.addEventListener('click', () => toast('Password reset disabled in evaluator build'));
  el('btn-back-login')?.addEventListener('click', () => showScreen('login'));
  el('btn-start-inspection')?.addEventListener('click', () => showScreen('scan'));
  el('btn-load-tag')?.addEventListener('click', () => loadBikeByTag(val('me-inp') || BIKES[0].tagId));
  el('nfc-scanner')?.addEventListener('click', () => loadBikeByTag(BIKES[0].tagId));
  el('btn-create-record')?.addEventListener('click', () => toast('Use one of the sample bikes for evaluator testing'));
  el('btn-back-scan')?.addEventListener('click', () => showScreen('scan'));
  el('btn-start-check')?.addEventListener('click', () => { buildChecklist(); showScreen('check'); });
  el('btn-back-profile')?.addEventListener('click', () => showScreen('profile'));
  el('btn-mark-photo')?.addEventListener('click', () => {
    if (!APP_STATE.inspectionDraft) return;
    APP_STATE.inspectionDraft.photoAdded = true;
    setText('photo-state', 'Photo confirmed');
    toast('Photo marked as added');
  });
  el('btn-complete-inspection')?.addEventListener('click', () => {
    if (!APP_STATE.inspectionDraft) return toast('Start checklist first');
    APP_STATE.inspectionDraft.notes = val('inspection-notes');
    APP_STATE.inspectionDraft.photoAdded = APP_STATE.inspectionDraft.photoAdded || !!el('photo-input')?.files?.length;
    renderSummary();
    showScreen('save');
  });
  el('btn-next-scan')?.addEventListener('click', () => { APP_STATE.currentBike = null; APP_STATE.inspectionDraft = null; showScreen('scan'); });
  el('btn-save-inspection')?.addEventListener('click', saveInspection);
  el('btn-export-json')?.addEventListener('click', exportInspectionJson);
  el('btn-print')?.addEventListener('click', () => window.print());
  el('history-search')?.addEventListener('input', renderHistoryLocal);
  el('history-filter')?.addEventListener('change', renderHistoryLocal);
  el('rider-search')?.addEventListener('input', (e) => renderLookupResults(e.target.value));
}

function restoreSession() {
  enableEvaluatorMode();
  showScreen('event');
  renderHistoryLocal();
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

document.addEventListener('DOMContentLoaded', () => {
  initRealtime();
  buildGCList();
  buildRiderDots();
  buildFanZone();
  initEventOptions();
  bindUi();
  restoreSession();
  renderLookupResults();
  setText('clock-badge', secondsToClock(APP_STATE.stage.elapsed));
  setText('rtb-gap', secondsToGap(APP_STATE.stage.gapSec));
  setText('rtb-km', APP_STATE.stage.kmToGo);
  setText('rtb-speed', APP_STATE.stage.avgSpeed);
  setText('km-marker', APP_STATE.stage.kmMarker);
  startLiveClock();
  startLiveUpdates();
  startFeedUpdater();

  // Fan Zone post submit wiring
  const btn = el('btn-submit-fan-post');
  if (btn) {
    btn.addEventListener('click', submitFanZonePost);
  }
});

  // --- Ensure History Export Buttons Work (global exposure) ---
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.exportAllInspectionsCSV = function () {
    const rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');

    if (!rows.length) {
      if (typeof toast === 'function') toast('No inspections to export');
      return;
    }

    const headers = [
      'created_at','event_name','rider','bib','team',
      'bike_tag','bike_brand','frame_model','overall_result','notes','synced'
    ];

    const escapeCSV = (value) => {
      const str = String(value == null ? '' : value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [
      headers.join(','),
      ...rows.map(row =>
        [
          row.created_at,
          row.event_name,
          row.rider,
          row.bib,
          row.team,
          row.bike_tag,
          row.bike_brand,
          row.frame_model,
          row.overall_result,
          row.notes,
          row._synced === true ? 'yes' : 'no'
        ].map(escapeCSV).join(',')
      )
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

    downloadBlob(`stitchx_inspections_${Date.now()}.csv`, blob);
  };

  window.exportAllInspections = function () {
    const rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');

    if (!rows.length) {
      if (typeof toast === 'function') toast('No inspections to export');
      return;
    }

    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: 'application/json'
    });

    downloadBlob(`stitchx_inspections_backup_${Date.now()}.json`, blob);
  };
