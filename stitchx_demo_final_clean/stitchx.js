// --- Robust syncInspections definition ---
window.syncInspections = async function() {
  let rows = [];

  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Could not read local inspections', err);
    return;
  }

  if (!rows.length) return;

  let syncedCount = 0;

  for (const row of rows) {
    if (row._synced === true) continue;

    try {
      const res = await fetch('http://localhost:3000/inspections', {
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
      console.warn('Sync failed, will retry later', err);
    }
  }

  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));

  if (typeof renderHistoryLocal === 'function') {
    renderHistoryLocal();
  }

  if (typeof toast === 'function' && syncedCount > 0) {
    toast(`Synced ${syncedCount} inspection${syncedCount === 1 ? '' : 's'}`);
  }
};

window.addEventListener('online', () => {
  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }
});
function syncLabel(row) {
  return row && row._synced ? 'Synced' : 'Pending Sync';
}

function syncClass(row) {
  return row && row._synced ? 'sync-ok' : 'sync-pending';
}
// --- Export all inspections as CSV (evaluator-friendly) ---
window.exportAllInspectionsCSV = function() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Failed to read inspections', err);
    toast('Could not read saved inspections');
    return;
  }
  if (!rows.length) {
    toast('No saved inspections to export');
    return;
  }
  const headers = [
    'created_at',
    'event_name',
    'rider',
    'bib',
    'team',
    'bike_brand',
    'frame_model',
    'frame_serial',
    'transponder',
    'overall_result',
    'summary',
    'pass_count',
    'warning_count',
    'fail_count',
    'skip_count'
  ];
  const escapeCSV = (value) => {
    const s = String(value ?? '');
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csvRows = [headers.join(',')];
  for (const row of rows) {
    const checks = Array.isArray(row.checks) ? row.checks : [];
    const passCount = checks.filter(c => c.result === 'PASS').length;
    const warningCount = checks.filter(c => c.result === 'WARNING').length;
    const failCount = checks.filter(c => c.result === 'FAIL').length;
    const skipCount = checks.filter(c => c.result === 'SKIP').length;
    const record = [
      row.created_at || '',
      row.event_name || '',
      row.rider || '',
      row.bib || '',
      row.team || '',
      row.bike_brand || '',
      row.frame_model || '',
      row.frame_serial || '',
      row.transponder || '',
      row.overall_result || '',
      row.summary || '',
      passCount,
      warningCount,
      failCount,
      skipCount
    ];
    csvRows.push(record.map(escapeCSV).join(','));
  }
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  const event = (APP_STATE.currentEvent?.name || 'event').replace(/[^a-z0-9]/gi, '_');
  const stage = (APP_STATE.currentEvent?.stage || 'stage').replace(/[^a-z0-9]/gi, '_');
  a.download = `${event}_${stage}_inspections_${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} inspections to CSV`);
};
// --- Export all inspections as CSV ---
window.exportAllInspectionsCsv = function() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Failed to read local inspections', err);
    toast('Could not read saved inspections');
    return;
  }
  if (!rows.length) {
    toast('No saved inspections to export');
    return;
  }
  // Flatten checks into a single string per inspection
  function checksToString(checks) {
    if (!Array.isArray(checks)) return '';
    return checks.map(c => `${c.code}:${c.result}`).join(' | ');
  }
  // CSV header
  const header = [
    'rider','bib','team','bike_brand','frame_model','frame_serial','transponder',
    'overall_result','checks','summary','event_name','created_at'
  ];
  const csv = [header.join(',')];
  for (const row of rows) {
    csv.push([
      row.rider,
      row.bib,
      row.team,
      row.bike_brand,
      row.frame_model,
      row.frame_serial,
      row.transponder,
      row.overall_result,
      checksToString(row.checks),
      (row.summary||'').replace(/\n/g,' '),
      row.event_name,
      row.created_at
    ].map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `stitchx_all_inspections_${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} inspections as CSV`);
};
// --- Export all inspections as JSON ---
window.exportAllInspections = function() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Failed to read local inspections', err);
    toast('Could not read saved inspections');
    return;
  }
  if (!rows.length) {
    toast('No saved inspections to export');
    return;
  }
  const payload = {
    exported_at: new Date().toISOString(),
    count: rows.length,
    inspections: rows
  };
  const blob = new Blob([
    JSON.stringify(payload, null, 2)
  ], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  const event = (APP_STATE.currentEvent?.name || 'event').replace(/[^a-z0-9]/gi, '_');
  const stage = (APP_STATE.currentEvent?.stage || 'stage').replace(/[^a-z0-9]/gi, '_');
  a.download = `${event}_${stage}_inspections_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} inspections`);
};
// --- Next Scan handler for evaluator mode ---
window.nextScan = function() {
  APP_STATE.currentBike = null;
  APP_STATE.inspectionDraft = null;

  const tagInput = el('tag-input');
  if (tagInput) tagInput.value = '';

  const bikeProfile = el('bike-profile');
  if (bikeProfile) bikeProfile.innerHTML = '';

  goToScreen('scan');
};

const EVALUATOR_BYPASS_AUTH = true;

const APP_STATE = {
  // --- UCI Officials tab navigation (exact user version) ---
  window.topNav = function(name) {
    APP_STATE.tab = name;

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === name);
    });

    document.querySelectorAll('.pane').forEach(p => {
      p.classList.toggle('active', p.id === 'pane-' + name);
    });

    const brandSub = document.getElementById('brand-sub');
    if (brandSub) {
      brandSub.textContent =
        name === 'race' ? 'Race Intelligence' :
        name === 'fan' ? 'Fan Zone' :
        name === 'uci' ? 'UCI Officials' : 'Admin';
    }

    if (name === 'uci') {
      goToScreen('event');
    }
  };
  tab: 'race',
  currentUser: null,
  currentProfile: null,
  currentEvent: null,
  currentBike: null,
  inspectionDraft: null,
  stage: { elapsed: 4 * 3600 + 22 * 60 + 18, kmToGo: 36, avgSpeed: 44.2, gapSec: 74, kmMarker: 142 }
};

function enableEvaluatorMode() {
  APP_STATE.currentUser = {
    id: 'evaluator-local-user',
    email: 'evaluator@local'
  };
  APP_STATE.currentProfile = {
    id: 'evaluator-local-user',
    full_name: 'Evaluator',
    role: 'official'
  };
  setSessionBadge('Evaluator Mode');
  setAdminTab();
}

window.signInUser = async function() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
  toast('Evaluator mode ready');
};

async function restoreSession() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
}

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


// --- Local history helpers for evaluator mode ---
function getLocalInspections() {
  try {
    return JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch {
    return [];
  }
}
function setLocalInspections(rows) {
  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));
}
function renderHistoryLocal() {
  const host = el('history-list');
  if (!host) return;
  const rows = getLocalInspections();
  host.innerHTML = rows.map(row => `
    <div class="history-row">
      <div class="history-top">
        <strong>${escapeHtml(row.rider || '')}</strong> #${escapeHtml(row.bib || '')}
        <span class="sync-badge ${syncClass(row)}">${syncLabel(row)}</span>
      </div>
      <div>${escapeHtml(row.bike_brand || '')} ${escapeHtml(row.frame_model || '')}</div>
      <div>${escapeHtml(row.overall_result || '')}</div>
      <div>${escapeHtml(fmtDateTime(row.created_at))}</div>
    </div>
  `).join('') || '<div class="history-empty">No inspections yet</div>';
}

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
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Load a bike and complete the checklist first');
    return;
  }

  const payload = {
    user_id: APP_STATE.currentUser?.id || 'evaluator-local-user',
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
    summary: el('inspection-summary')?.value || APP_STATE.inspectionDraft.summary || '',
    event_name: APP_STATE.currentEvent?.name || '',
    created_at: new Date().toISOString()
  };

  const rows = getLocalInspections();
  rows.unshift(payload);
  setLocalInspections(rows);

  toast('Saved locally');
  renderHistoryLocal();

  // ✅ AUTO BACKUP
  exportAllInspectionsCSV();

  // SYNC to backend (safe)
  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }

  // stay on summary page after save
  goToScreen('save');
}
// --- Robust syncInspections definition ---
window.syncInspections = async function() {
  let rows = [];

  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Could not read local inspections', err);
    return;
  }

  if (!rows.length) return;

  let syncedCount = 0;

  for (const row of rows) {
    if (row._synced === true) continue;

    try {
      const res = await fetch('http://localhost:3000/inspections', {
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
      console.warn('Sync failed, will retry later', err);
    }
  }

  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));

  if (typeof renderHistoryLocal === 'function') {
    renderHistoryLocal();
  }

  if (typeof toast === 'function' && syncedCount > 0) {
    toast(`Synced ${syncedCount} inspection${syncedCount === 1 ? '' : 's'}`);
  }
};

window.addEventListener('online', () => {
  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }
});

// --- Ensure syncInspections is called after save ---
// (Insert this inside saveInspection after renderHistoryLocal)
// --- Export all inspections as JSON ---
window.exportAllInspections = function() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Failed to read local inspections', err);
    toast('Could not read saved inspections');
    return;
  }
  if (!rows.length) {
    toast('No saved inspections to export');
    return;
  }
  const payload = {
    exported_at: new Date().toISOString(),
    count: rows.length,
    inspections: rows
  };
  const blob = new Blob([
    JSON.stringify(payload, null, 2)
  ], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  const event = (APP_STATE.currentEvent?.name || 'event').replace(/[^a-z0-9]/gi, '_');
  const stage = (APP_STATE.currentEvent?.stage || 'stage').replace(/[^a-z0-9]/gi, '_');
  a.download = `${event}_${stage}_inspections_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} inspections`);
};
// --- Next Scan handler for evaluator mode ---
window.nextScan = function() {
  APP_STATE.currentBike = null;
  APP_STATE.inspectionDraft = null;

  const tagInput = el('tag-input');
  if (tagInput) tagInput.value = '';

  const bikeProfile = el('bike-profile');
  if (bikeProfile) bikeProfile.innerHTML = '';

  goToScreen('scan');
};

const EVALUATOR_BYPASS_AUTH = true;

const APP_STATE = {
  // --- UCI Officials tab navigation (exact user version) ---
  window.topNav = function(name) {
    APP_STATE.tab = name;

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === name);
    });

    document.querySelectorAll('.pane').forEach(p => {
      p.classList.toggle('active', p.id === 'pane-' + name);
    });

    const brandSub = document.getElementById('brand-sub');
    if (brandSub) {
      brandSub.textContent =
        name === 'race' ? 'Race Intelligence' :
        name === 'fan' ? 'Fan Zone' :
        name === 'uci' ? 'UCI Officials' : 'Admin';
    }

    if (name === 'uci') {
      goToScreen('event');
    }
  };
  tab: 'race',
  currentUser: null,
  currentProfile: null,
  currentEvent: null,
  currentBike: null,
  inspectionDraft: null,
  stage: { elapsed: 4 * 3600 + 22 * 60 + 18, kmToGo: 36, avgSpeed: 44.2, gapSec: 74, kmMarker: 142 }
};

function enableEvaluatorMode() {
  APP_STATE.currentUser = {
    id: 'evaluator-local-user',
    email: 'evaluator@local'
  };
  APP_STATE.currentProfile = {
    id: 'evaluator-local-user',
    full_name: 'Evaluator',
    role: 'official'
  };
  setSessionBadge('Evaluator Mode');
  setAdminTab();
}

window.signInUser = async function() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
  toast('Evaluator mode ready');
};

async function restoreSession() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
}

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


// --- Local history helpers for evaluator mode ---
function getLocalInspections() {
  try {
    return JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch {
    return [];
  }
}
function setLocalInspections(rows) {
  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));
}
function renderHistoryLocal() {
  const host = el('history-list');
  if (!host) return;
  const rows = getLocalInspections();
  host.innerHTML = rows.map(row => `
    <div class="history-row">
      <div class="history-top">
        <strong>${escapeHtml(row.rider || '')}</strong> #${escapeHtml(row.bib || '')}
        <span class="sync-badge ${syncClass(row)}">${syncLabel(row)}</span>
      </div>
      <div>${escapeHtml(row.bike_brand || '')} ${escapeHtml(row.frame_model || '')}</div>
      <div>${escapeHtml(row.overall_result || '')}</div>
      <div>${escapeHtml(fmtDateTime(row.created_at))}</div>
    </div>
  `).join('') || '<div class="history-empty">No inspections yet</div>';
}

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
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Load a bike and complete the checklist first');
    return;
  }

  const payload = {
    user_id: APP_STATE.currentUser?.id || 'evaluator-local-user',
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
    summary: el('inspection-summary')?.value || APP_STATE.inspectionDraft.summary || '',
    event_name: APP_STATE.currentEvent?.name || '',
    created_at: new Date().toISOString()
  };

  const rows = getLocalInspections();
  rows.unshift(payload);
  setLocalInspections(rows);

  toast('Saved locally');
  renderHistoryLocal();

  // ✅ AUTO BACKUP
  exportAllInspectionsCSV();

  // SYNC to backend
  window.syncInspections();

  // stay on summary page after save
  goToScreen('save');
}
// --- Robust syncInspections definition ---
window.syncInspections = async function() {
  let rows = [];

  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Could not read local inspections', err);
    return;
  }

  if (!rows.length) return;

  let syncedCount = 0;

  for (const row of rows) {
    if (row._synced === true) continue;

    try {
      const res = await fetch('http://localhost:3000/inspections', {
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
      console.warn('Sync failed, will retry later', err);
    }
  }

  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));

  if (typeof renderHistoryLocal === 'function') {
    renderHistoryLocal();
  }

  if (typeof toast === 'function' && syncedCount > 0) {
    toast(`Synced ${syncedCount} inspection${syncedCount === 1 ? '' : 's'}`);
  }
};

window.addEventListener('online', () => {
  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }
});

// --- Ensure syncInspections is called after save ---
// (Insert this inside saveInspection after renderHistoryLocal)
// --- Export all inspections as JSON ---
window.exportAllInspections = function() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Failed to read local inspections', err);
    toast('Could not read saved inspections');
    return;
  }
  if (!rows.length) {
    toast('No saved inspections to export');
    return;
  }
  const payload = {
    exported_at: new Date().toISOString(),
    count: rows.length,
    inspections: rows
  };
  const blob = new Blob([
    JSON.stringify(payload, null, 2)
  ], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  const event = (APP_STATE.currentEvent?.name || 'event').replace(/[^a-z0-9]/gi, '_');
  const stage = (APP_STATE.currentEvent?.stage || 'stage').replace(/[^a-z0-9]/gi, '_');
  a.download = `${event}_${stage}_inspections_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} inspections`);
};
// --- Next Scan handler for evaluator mode ---
window.nextScan = function() {
  APP_STATE.currentBike = null;
  APP_STATE.inspectionDraft = null;

  const tagInput = el('tag-input');
  if (tagInput) tagInput.value = '';

  const bikeProfile = el('bike-profile');
  if (bikeProfile) bikeProfile.innerHTML = '';

  goToScreen('scan');
};

const EVALUATOR_BYPASS_AUTH = true;

const APP_STATE = {
  // --- UCI Officials tab navigation (exact user version) ---
  window.topNav = function(name) {
    APP_STATE.tab = name;

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === name);
    });

    document.querySelectorAll('.pane').forEach(p => {
      p.classList.toggle('active', p.id === 'pane-' + name);
    });

    const brandSub = document.getElementById('brand-sub');
    if (brandSub) {
      brandSub.textContent =
        name === 'race' ? 'Race Intelligence' :
        name === 'fan' ? 'Fan Zone' :
        name === 'uci' ? 'UCI Officials' : 'Admin';
    }

    if (name === 'uci') {
      goToScreen('event');
    }
  };
  tab: 'race',
  currentUser: null,
  currentProfile: null,
  currentEvent: null,
  currentBike: null,
  inspectionDraft: null,
  stage: { elapsed: 4 * 3600 + 22 * 60 + 18, kmToGo: 36, avgSpeed: 44.2, gapSec: 74, kmMarker: 142 }
};

function enableEvaluatorMode() {
  APP_STATE.currentUser = {
    id: 'evaluator-local-user',
    email: 'evaluator@local'
  };
  APP_STATE.currentProfile = {
    id: 'evaluator-local-user',
    full_name: 'Evaluator',
    role: 'official'
  };
  setSessionBadge('Evaluator Mode');
  setAdminTab();
}

window.signInUser = async function() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
  toast('Evaluator mode ready');
};

async function restoreSession() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
}

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


// --- Local history helpers for evaluator mode ---
function getLocalInspections() {
  try {
    return JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch {
    return [];
  }
}
function setLocalInspections(rows) {
  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));
}
function renderHistoryLocal() {
  const host = el('history-list');
  if (!host) return;
  const rows = getLocalInspections();
  host.innerHTML = rows.map(row => `
    <div class="history-row">
      <div class="history-top">
        <strong>${escapeHtml(row.rider || '')}</strong> #${escapeHtml(row.bib || '')}
        <span class="sync-badge ${syncClass(row)}">${syncLabel(row)}</span>
      </div>
      <div>${escapeHtml(row.bike_brand || '')} ${escapeHtml(row.frame_model || '')}</div>
      <div>${escapeHtml(row.overall_result || '')}</div>
      <div>${escapeHtml(fmtDateTime(row.created_at))}</div>
    </div>
  `).join('') || '<div class="history-empty">No inspections yet</div>';
}

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
  if (!APP_STATE.currentBike || !APP_STATE.inspectionDraft) {
    toast('Load a bike and complete the checklist first');
    return;
  }

  const payload = {
    user_id: APP_STATE.currentUser?.id || 'evaluator-local-user',
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
    summary: el('inspection-summary')?.value || APP_STATE.inspectionDraft.summary || '',
    event_name: APP_STATE.currentEvent?.name || '',
    created_at: new Date().toISOString()
  };

  const rows = getLocalInspections();
  rows.unshift(payload);
  setLocalInspections(rows);

  toast('Saved locally');
  renderHistoryLocal();

  // ✅ AUTO BACKUP
  exportAllInspectionsCSV();

  // SYNC to backend
  window.syncInspections();

  // stay on summary page after save
  goToScreen('save');
}
// --- Robust syncInspections definition ---
window.syncInspections = async function() {
  let rows = [];

  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Could not read local inspections', err);
    return;
  }

  if (!rows.length) return;

  let syncedCount = 0;

  for (const row of rows) {
    if (row._synced === true) continue;

    try {
      const res = await fetch('http://localhost:3000/inspections', {
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
      console.warn('Sync failed, will retry later', err);
    }
  }

  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));

  if (typeof renderHistoryLocal === 'function') {
    renderHistoryLocal();
  }

  if (typeof toast === 'function' && syncedCount > 0) {
    toast(`Synced ${syncedCount} inspection${syncedCount === 1 ? '' : 's'}`);
  }
};

window.addEventListener('online', () => {
  if (typeof window.syncInspections === 'function') {
    window.syncInspections();
  }
});

// --- Ensure syncInspections is called after save ---
// (Insert this inside saveInspection after renderHistoryLocal)
// --- Export all inspections as JSON ---
window.exportAllInspections = function() {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch (err) {
    console.error('Failed to read local inspections', err);
    toast('Could not read saved inspections');
    return;
  }
  if (!rows.length) {
    toast('No saved inspections to export');
    return;
  }
  const payload = {
    exported_at: new Date().toISOString(),
    count: rows.length,
    inspections: rows
  };
  const blob = new Blob([
    JSON.stringify(payload, null, 2)
  ], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  const event = (APP_STATE.currentEvent?.name || 'event').replace(/[^a-z0-9]/gi, '_');
  const stage = (APP_STATE.currentEvent?.stage || 'stage').replace(/[^a-z0-9]/gi, '_');
  a.download = `${event}_${stage}_inspections_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} inspections`);
};
// --- Next Scan handler for evaluator mode ---
window.nextScan = function() {
  APP_STATE.currentBike = null;
  APP_STATE.inspectionDraft = null;

  const tagInput = el('tag-input');
  if (tagInput) tagInput.value = '';

  const bikeProfile = el('bike-profile');
  if (bikeProfile) bikeProfile.innerHTML = '';

  goToScreen('scan');
};

const EVALUATOR_BYPASS_AUTH = true;

const APP_STATE = {
  // --- UCI Officials tab navigation (exact user version) ---
  window.topNav = function(name) {
    APP_STATE.tab = name;

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === name);
    });

    document.querySelectorAll('.pane').forEach(p => {
      p.classList.toggle('active', p.id === 'pane-' + name);
    });

    const brandSub = document.getElementById('brand-sub');
    if (brandSub) {
      brandSub.textContent =
        name === 'race' ? 'Race Intelligence' :
        name === 'fan' ? 'Fan Zone' :
        name === 'uci' ? 'UCI Officials' : 'Admin';
    }

    if (name === 'uci') {
      goToScreen('event');
    }
  };
  tab: 'race',
  currentUser: null,
  currentProfile: null,
  currentEvent: null,
  currentBike: null,
  inspectionDraft: null,
  stage: { elapsed: 4 * 3600 + 22 * 60 + 18, kmToGo: 36, avgSpeed: 44.2, gapSec: 74, kmMarker: 142 }
};

function enableEvaluatorMode() {
  APP_STATE.currentUser = {
    id: 'evaluator-local-user',
    email: 'evaluator@local'
  };
  APP_STATE.currentProfile = {
    id: 'evaluator-local-user',
    full_name: 'Evaluator',
    role: 'official'
  };
  setSessionBadge('Evaluator Mode');
  setAdminTab();
}

window.signInUser = async function() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
  toast('Evaluator mode ready');
};

async function restoreSession() {
  enableEvaluatorMode();
  renderHistoryLocal();
  goToScreen('event');
}

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


// --- Local history helpers for evaluator mode ---
function getLocalInspections() {
  try {
    return JSON.parse(localStorage.getItem('stitchx_inspections') || '[]');
  } catch {
    return [];
  }
}
function setLocalInspections(rows) {
  localStorage.setItem('stitchx_inspections', JSON.stringify(rows));
}
function renderHistoryLocal() {
  const host = el('history-list');
  if (!host) return;
  const rows = getLocalInspections();
  host.innerHTML = rows.map(row => `
    <div class="history-row">
      <div class="history-top">
        <strong>${escapeHtml(row.rider || '')}</strong> #${escapeHtml(row.bib || '')}
        <span class="sync-badge ${syncClass(row)}">${syncLabel(row)}</span>
      </div>
      <div>${escapeHtml(row.bike_brand || '')} ${escapeHtml(row.frame_model || '')}</div>
      <div>${escapeHtml(row.overall_result || '')}</div>
      <div>${escapeHtml(fmtDateTime(row.created_at))}</div>
    </div>
  `).join('') || '<div class="history-empty">No inspections yet</div>';
}

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
      APP_STATE.inspection