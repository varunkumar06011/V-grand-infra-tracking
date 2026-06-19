const STATUS_LABELS = {
  red: 'Yet to start',
  yellow: 'In progress',
  blue: 'Patch work / pending',
  green: 'Completed'
};

const DEFAULT_WORK_ITEMS = [
  'BRICK WORK',
  'ELECTRICAL PIPE',
  'MESH',
  'PLASTERING',
  'CEILING PAINT',
  'POP FRAME',
  'CEILING WIRING',
  'POP SHEETS',
  'WALL CARE',
  'BATHROOM PLUMBING',
  'WINDOW FRAME',
  'BATH SWR LINES',
  'BATH CONCRETING',
  'TILES',
  'DOORS FITTING',
  'PAINT PRIMER',
  'PAINT 1st COAT',
  'WINDOWS FITTING',
  'SWITCH BOARD FITTING',
  'PATCH WORK',
  '2nd COAT PAINTING'
];

const WORK_CATEGORIES = {
  'CIVIL WORK': [
    'Brick work', 'Lintel', 'Lanter', 'Mesh', 'Mesh & Brickwork NCC',
    'Connections', 'Lift', 'Cupboards', 'Red Oxide Duraplus Primer',
    'Red Oxide Duraplus Primer (2nd coat)', 'Bathroom Service Chargable'
  ],
  'ELECTRICAL & PLUMBING WORK': [
    'Electrical pipe', 'Pipe & GI box', 'Wiring',
    'Bathroom Chipped', 'Bathroom Geyser Pipe',
    'Bathroom Geyser & Pipes', 'Sanitary Board & Nand',
    'GC & Bath Fitting'
  ],
  'POP CEILING': [
    'Pop bolster work', 'Pop ready work', 'Casing',
    'Balloon PVC Box Fitting', 'Connections / Measurement'
  ],
  'PAINTING': [
    'Colour Primer', 'Wall Care Plaster',
    'Wall Care Slastoat', 'Wall Primer', 'Primer',
    'Colour to Edge'
  ],
  'FLOORING': [
    'Bathroom Wall Tiles', 'Tile Laying',
    'Tile Cutting', 'Connections', 'Window Dhanis',
    'Colour to Edge', 'Wedding Dhanis'
  ]
};

const CORRIDORS = [
  'Plaster', 'Mesh', 'Lanter', 'Wiring', 'Stains & Cleaning', 'Flooring'
];

const ELEVATION_WORK = [
  'Marka', 'Elevation', 'Electrics', 'Wall Care', 'Texture'
];

const SUPER_STRUCTURE_ITEMS = [
  'Site Preparation', 'Excavation', 'Marking', 'Piles', 'Piles Concrete',
  'Pile Caps', 'Plinth Beam', 'Plinth Wall', 'Filling', '40mm Bed',
  'Sunken Tank', 'Columns for 1st Slab', 'Slab Shuttering for 1st Slab',
  'Bar Bending for 1st Slab', 'Electrical Pipes', '1st Slab Casting',
  'Columns for 2nd Slab', 'Shuttering for 2nd Slab', 'Bar Bending for 2nd Slab',
  'Electrical Pipes', '2nd Slab Casting', 'Columns for 3rd Slab',
  'Slab Shuttering for 3rd Slab', 'Bar Bending for 3rd Slab', 'Electrical Pipes',
  '3rd Slab Casting', 'Columns for 4th Slab', 'Slab Shuttering for 4th Slab',
  'Bar Bending for 4th Slab', 'Electrical Pipes', '4th Slab Casting',
  'Columns for 5th Slab', 'Slab Shuttering for 5th Slab', 'Bar Bending for 5th Slab',
  'Electrical Pipes', '5th Slab Casting', 'Columns for 6th Slab',
  'Slab Shuttering for 6th Slab', 'Bar Bending for 6th Slab', 'Electrical Pipes',
  '6th Slab Casting', 'Columns for Lift Tank & Stairs', 'Shuttering for Above',
  'Slab Casting', 'Water Tank Bar Bending', 'Water Tank NCC',
  'Elevation Scaffolding', 'Elevation Mess & Packing', 'Elevation Brick Work',
  'Elevation (Plastering)', 'Electrical SWM & Plumbing Outside Lines',
  '1M CH Work', 'Scaffolding Removal', 'Patch Work', 'Elevation Texture',
  'Elevation Primer', 'Elevation Paint 1st Coat', 'Compound Wall Columns & Beam',
  'Compound Wall Brick & Plastering', 'Compound Wall Paint', 'Final Coat'
];

const BLOCKS = ['A', 'B'];
const FLOORS = [1, 2, 3, 4, 5];
const FLATS_PER_FLOOR = 6;

const LOGIN_EMAIL = 'vgrand@123';
const LOGIN_PASSWORD = 'vgrand1234';
const APP_VERSION = '2';

// Version check: if app updated, clear stored work items so new defaults load
const storedVersion = localStorage.getItem('vgrand_app_version');
if (storedVersion !== APP_VERSION) {
  localStorage.removeItem('vgrand_settings_workItems');
  localStorage.setItem('vgrand_app_version', APP_VERSION);
}

// localStorage helpers
function dbGet(docPath) {
  const key = 'vgrand_' + docPath.replace(/\//g, '_');
  const raw = localStorage.getItem(key);
  if (raw) {
    const data = JSON.parse(raw);
    return { exists: true, data: () => data };
  }
  return { exists: false, data: () => null };
}

function dbSet(docPath, data, merge = false) {
  const key = 'vgrand_' + docPath.replace(/\//g, '_');
  let existing = {};
  const raw = localStorage.getItem(key);
  if (raw) existing = JSON.parse(raw);
  const merged = merge ? { ...existing, ...data } : { ...data };
  localStorage.setItem(key, JSON.stringify(merged));
}

// State
let currentUser = null;
let currentBlock = 'A';
let currentFloor = 1;
let workItems = [];
let cellsCache = {};
let currentView = 'flat';
let selectedCellId = null;
let selectedWorkIndex = null;
let selectedFlatNum = null;
let selectedColor = null;

// DOM refs
const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const settingsPage = document.getElementById('settings-page');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const authToggle = document.getElementById('auth-toggle');
const authError = document.getElementById('auth-error');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const userEmail = document.getElementById('user-email');
const signOutBtn = document.getElementById('sign-out-btn');
const settingsBtn = document.getElementById('settings-btn');
const backBtn = document.getElementById('back-btn');
const loading = document.getElementById('loading');
const trackerHead = document.getElementById('tracker-head');
const trackerBody = document.getElementById('tracker-body');
const statusPopup = document.getElementById('status-popup');
const popupTitle = document.getElementById('popup-title');
const popupSub = document.getElementById('popup-sub');
const popupCurrent = document.getElementById('popup-current');
const popupSave = document.getElementById('popup-save');
const popupCancel = document.getElementById('popup-cancel');
const popupClear = document.getElementById('popup-clear');
const timelineModal = document.getElementById('timeline-modal');
const modalTitle = document.getElementById('modal-title');
const modalSub = document.getElementById('modal-sub');
const timelineList = document.getElementById('timeline-list');
const modalRemarks = document.getElementById('modal-remarks');
const modalClose = document.getElementById('modal-close');
const modalSave = document.getElementById('modal-save');
const workList = document.getElementById('work-list');
const addWorkBtn = document.getElementById('add-work-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const demoLoginBtn = document.getElementById('demo-login');
const summaryBlock = document.getElementById('summary-block');
const summaryFloor = document.getElementById('summary-floor');
const summaryBody = document.getElementById('summary-body');
const workViewContainer = document.getElementById('work-view-container');
const ssGrid = document.getElementById('ss-grid');

// --- Auth ---
let isRegister = false;

// Pre-fill inputs
document.addEventListener('DOMContentLoaded', () => {
  emailInput.value = LOGIN_EMAIL;
  passwordInput.value = LOGIN_PASSWORD;
});

authToggle.addEventListener('click', () => {
  isRegister = !isRegister;
  authTitle.textContent = isRegister ? 'Register' : 'Login';
  authSubmit.textContent = isRegister ? 'Register' : 'Login';
  authToggle.textContent = isRegister ? 'Already have an account? Login' : "Don't have an account? Register";
  authError.textContent = '';
});

async function handleLoginSuccess(email) {
  currentUser = { email: email };
  userEmail.textContent = email;
  authScreen.style.display = 'none';
  dashboard.style.display = 'block';
  settingsPage.style.display = 'none';
  await initDashboard();
}

function handleLogout() {
  currentUser = null;
  authScreen.style.display = 'flex';
  dashboard.style.display = 'none';
  settingsPage.style.display = 'none';
}

function checkLogin(email, password) {
  if (email === LOGIN_EMAIL && password === LOGIN_PASSWORD) {
    return { email: LOGIN_EMAIL };
  }
  throw new Error('Invalid credentials. Use vgrand@123 / vgrand1234');
}

authSubmit.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  authError.textContent = '';
  try {
    checkLogin(email, password);
    await handleLoginSuccess(email);
  } catch (err) {
    authError.textContent = err.message;
  }
});

demoLoginBtn.addEventListener('click', async () => {
  emailInput.value = LOGIN_EMAIL;
  passwordInput.value = LOGIN_PASSWORD;
  authError.textContent = '';
  try {
    checkLogin(LOGIN_EMAIL, LOGIN_PASSWORD);
    await handleLoginSuccess(LOGIN_EMAIL);
  } catch (err) {
    authError.textContent = err.message;
  }
});

signOutBtn.addEventListener('click', () => handleLogout());

// --- Dashboard Init ---
async function initDashboard() {
  showLoading(true);
  await loadWorkItems();
  await loadAllCells();
  updateBlockClass();
  if (currentView === 'work') {
    renderWorkView();
  } else if (currentView === 'super') {
    renderSuperStructure();
  } else {
    renderTracker();
    renderSummary();
  }
  showLoading(false);
}

// --- Work Items ---
async function loadWorkItems() {
  const snap = dbGet('settings/workItems');
  if (snap.exists) {
    workItems = snap.data().items || [];
  } else {
    workItems = [...DEFAULT_WORK_ITEMS];
    dbSet('settings/workItems', { items: workItems });
  }
}

async function saveWorkItems() {
  const inputs = workList.querySelectorAll('.work-item-input');
  workItems = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
  dbSet('settings/workItems', { items: workItems });
}

// --- Cells ---
function getFlatNumbers(floor) {
  const base = floor * 100;
  return Array.from({ length: FLATS_PER_FLOOR }, (_, i) => base + i + 1);
}

function getCellId(block, floor, flatNum, workIndex) {
  return `${block}_floor${floor}_${flatNum}_${workIndex}`;
}

function getWorkViewCellId(block, floor, category, workIndex, flatNum) {
  return `${block}_floor${floor}_${category}_${workIndex}_${flatNum}`;
}

async function loadAllCells() {
  cellsCache = {};
  if (currentView === 'work') {
    await loadWorkViewCells();
    return;
  }
  if (currentView === 'super') {
    await loadSuperCells();
    return;
  }
  const flats = getFlatNumbers(currentFloor);
  for (let wi = 0; wi < workItems.length; wi++) {
    for (const flat of flats) {
      const cellId = getCellId(currentBlock, currentFloor, flat, wi);
      const snap = dbGet(`projects/vgrand/cells/${cellId}`);
      if (snap.exists) {
        cellsCache[cellId] = snap.data();
      }
    }
  }
}

async function loadWorkViewCells() {
  const flats = getFlatNumbers(currentFloor);
  const categories = Object.keys(WORK_CATEGORIES);
  for (const cat of categories) {
    const items = WORK_CATEGORIES[cat];
    for (let wi = 0; wi < items.length; wi++) {
      for (const flat of flats) {
        const cellId = getWorkViewCellId(currentBlock, currentFloor, cat, wi, flat);
        const snap = dbGet(`projects/vgrand/cells/${cellId}`);
        if (snap.exists) {
          cellsCache[cellId] = snap.data();
        }
      }
    }
  }
  // Corridors
  for (let wi = 0; wi < CORRIDORS.length; wi++) {
    const cellId = `${currentBlock}_floor${currentFloor}_corridor_${wi}`;
    const snap = dbGet(`projects/vgrand/cells/${cellId}`);
    if (snap.exists) {
      cellsCache[cellId] = snap.data();
    }
  }
  // Elevation Work
  for (let wi = 0; wi < ELEVATION_WORK.length; wi++) {
    const cellId = `${currentBlock}_floor${currentFloor}_elevation_${wi}`;
    const snap = dbGet(`projects/vgrand/cells/${cellId}`);
    if (snap.exists) {
      cellsCache[cellId] = snap.data();
    }
  }
}

async function loadSuperCells() {
  for (const block of BLOCKS) {
    for (let wi = 0; wi < SUPER_STRUCTURE_ITEMS.length; wi++) {
      const cellId = `superstructure_${block}_${wi}`;
      const snap = dbGet(`projects/vgrand/cells/${cellId}`);
      if (snap.exists) {
        cellsCache[cellId] = snap.data();
      }
    }
  }
}

async function saveSuperStatus(block, workIndex, status) {
  const cellId = `superstructure_${block}_${workIndex}`;
  const now = Date.now();
  const existing = await getCellData(cellId) || {};
  const timeline = existing.timeline || [];
  const oldRemarks = existing.remarks || '';

  const entry = {
    status: status,
    status_label: status ? STATUS_LABELS[status] : 'Cleared',
    date: getTodayDate(),
    changed_by: currentUser.email,
    timestamp: now
  };
  timeline.push(entry);

  // Strip old auto-remarks before adding new one
  const autoPatterns = ['Patch work started on', 'Completed on', 'Work started on'];
  let cleanedRemarks = oldRemarks
    .split('\n')
    .filter(line => !autoPatterns.some(p => line.trim().startsWith(p)))
    .join('\n')
    .trim();

  let newRemarks = cleanedRemarks;
  if (status) {
    const auto = getAutoRemark(status);
    if (auto) {
      newRemarks = cleanedRemarks ? cleanedRemarks + '\n' + auto : auto;
    }
  }

  const data = {
    status: status || null,
    timeline: timeline,
    remarks: newRemarks,
    updated_at: now,
    updated_by: currentUser.email
  };

  dbSet(`projects/vgrand/cells/${cellId}`, data, true);
  cellsCache[cellId] = { ...existing, ...data };
}

async function getCellData(cellId) {
  if (cellsCache[cellId]) return cellsCache[cellId];
  const snap = dbGet(`projects/vgrand/cells/${cellId}`);
  if (snap.exists) {
    cellsCache[cellId] = snap.data();
    return snap.data();
  }
  return null;
}

function getTodayDate() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getAutoRemark(color) {
  const date = getTodayDate();
  switch (color) {
    case 'blue': return `Patch work started on ${date}`;
    case 'green': return `Completed on ${date}`;
    case 'yellow': return `Work started on ${date}`;
    default: return '';
  }
}

async function saveCellStatus(cellId, color, workIndex, flatNum) {
  const now = Date.now();
  const existing = await getCellData(cellId) || {};
  const timeline = existing.timeline || [];
  const oldRemarks = existing.remarks || '';

  const entry = {
    color: color,
    status_label: color ? STATUS_LABELS[color] : 'Cleared',
    date: getTodayDate(),
    changed_by: currentUser.email,
    timestamp: now
  };

  timeline.push(entry);

  // Strip old auto-remarks before adding the new one
  const autoPatterns = ['Patch work started on', 'Completed on', 'Work started on'];
  let cleanedRemarks = oldRemarks
    .split('\n')
    .filter(line => !autoPatterns.some(p => line.trim().startsWith(p)))
    .join('\n')
    .trim();

  let newRemarks = cleanedRemarks;
  if (color) {
    const auto = getAutoRemark(color);
    if (auto) {
      newRemarks = cleanedRemarks ? cleanedRemarks + '\n' + auto : auto;
    }
  }

  const data = {
    color: color || null,
    timeline: timeline,
    remarks: newRemarks,
    updated_at: now,
    updated_by: currentUser.email
  };

  dbSet(`projects/vgrand/cells/${cellId}`, data, true);
  cellsCache[cellId] = { ...existing, ...data };
}

async function saveCellRemarks(cellId, remarks) {
  const payload = {
    remarks: remarks,
    updated_at: Date.now(),
    updated_by: currentUser.email
  };
  dbSet(`projects/vgrand/cells/${cellId}`, payload, true);
  const existing = cellsCache[cellId] || {};
  cellsCache[cellId] = { ...existing, remarks };
}

// --- Rendering ---
function renderTracker() {
  document.querySelector('.tracker-wrapper').style.display = 'block';
  document.getElementById('summary-panel').style.display = 'block';
  workViewContainer.style.display = 'none';

  const flats = getFlatNumbers(currentFloor);

  // Header
  let headHtml = '<tr><th>Work Item</th>';
  for (const flat of flats) {
    headHtml += `<th>${flat}</th>`;
  }
  headHtml += '<th>Remarks</th></tr>';
  trackerHead.innerHTML = headHtml;

  // Body
  let bodyHtml = '';
  for (let wi = 0; wi < workItems.length; wi++) {
    const workName = workItems[wi];
    let rowHtml = `<tr><td>${workName}</td>`;
    let rowRemarks = [];

    for (const flat of flats) {
      const cellId = getCellId(currentBlock, currentFloor, flat, wi);
      const cell = cellsCache[cellId];
      const color = cell && cell.color ? cell.color : null;
      const colorClass = color ? color : '';
      const remarks = cell && cell.remarks ? cell.remarks : '';
      if (remarks) rowRemarks.push(`${flat}: ${remarks}`);

      rowHtml += `<td>
        <div class="cell-btn ${colorClass}" data-cell="${cellId}" data-work="${wi}" data-flat="${flat}"></div>
        <span class="history-link" data-cell="${cellId}" data-work="${wi}" data-flat="${flat}">history</span>
      </td>`;
    }

    const remarksText = rowRemarks.length > 0
      ? rowRemarks.map(r => r.length > 40 ? r.substring(0, 40) + '...' : r).join(' | ')
      : '';
    rowHtml += `<td>${remarksText}</td></tr>`;
    bodyHtml += rowHtml;
  }
  trackerBody.innerHTML = bodyHtml;

  // Attach events
  trackerBody.querySelectorAll('.cell-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openStatusPopup(
      btn.dataset.cell,
      parseInt(btn.dataset.work),
      parseInt(btn.dataset.flat),
      null
    ));
  });
  trackerBody.querySelectorAll('.history-link').forEach(link => {
    link.addEventListener('click', (e) => openTimelineModal(
      link.dataset.cell,
      parseInt(link.dataset.work),
      parseInt(link.dataset.flat),
      null
    ));
  });
  renderSummary();
}

function updateBlockClass() {
  dashboard.classList.remove('block-a', 'block-b');
  dashboard.classList.add(currentBlock === 'B' ? 'block-b' : 'block-a');
}

function getOrdinalText(n) {
  const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];
  return ordinals[n] || (n + 'th');
}

function renderSummary() {
  summaryBlock.textContent = currentBlock;
  summaryFloor.textContent = getOrdinalText(currentFloor);
  const flats = getFlatNumbers(currentFloor);
  let html = '';
  flats.forEach((flat, idx) => {
    let flatRemarks = [];
    let latestEntry = null;
    for (let wi = 0; wi < workItems.length; wi++) {
      const cellId = getCellId(currentBlock, currentFloor, flat, wi);
      const cell = cellsCache[cellId];
      if (cell && cell.remarks) {
        flatRemarks.push(cell.remarks);
      }
      if (cell && cell.timeline && cell.timeline.length > 0) {
        const last = cell.timeline[cell.timeline.length - 1];
        if (last.timestamp && (!latestEntry || last.timestamp > latestEntry.timestamp)) {
          latestEntry = last;
        }
      }
    }
    const latestDate = latestEntry ? latestEntry.date : '';
    const remarksText = flatRemarks.length > 0
      ? flatRemarks.join(' | ').substring(0, 200) + (flatRemarks.join(' | ').length > 200 ? '...' : '')
      : '';
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${flat}</td>
      <td>${latestDate || '-'}</td>
      <td>${remarksText}</td>
    </tr>`;
  });
  summaryBody.innerHTML = html;
}

// --- Super Structure Rendering ---
function renderSuperStructure() {
  document.querySelector('.tracker-wrapper').style.display = 'none';
  document.getElementById('summary-panel').style.display = 'none';
  workViewContainer.style.display = 'none';
  document.getElementById('superstructure-container').style.display = 'block';

  const statuses = ['red', 'yellow', 'blue', 'green'];
  const statusLabels = { red: 'Yet to Start', yellow: 'In Progress', blue: 'Pending', green: 'Completed' };

  let html = '';
  for (const block of BLOCKS) {
    html += `<div class="ss-block">`;
    html += `<div class="ss-block-title">${block} BLOCK</div>`;
    html += `<div style="overflow-x:auto;"><table class="ss-table">`;
    html += `<thead><tr><th>S.No</th><th>Work Description</th>`;
    html += `<th>Yet to Start</th><th>In Progress</th><th>Pending</th><th>Completed</th>`;
    html += `</tr></thead><tbody>`;

    SUPER_STRUCTURE_ITEMS.forEach((item, wi) => {
      const cellId = `superstructure_${block}_${wi}`;
      const cell = cellsCache[cellId];
      const currentStatus = cell && cell.status ? cell.status : null;

      html += `<tr><td>${wi + 1}</td><td>${item}</td>`;
      statuses.forEach(st => {
        const isActive = currentStatus === st;
        const activeClass = isActive ? `active-${st}` : '';
        html += `<td><div class="ss-cell ${activeClass}" data-cell="${cellId}" data-work="${wi}" data-status="${st}" data-block="${block}" title="${statusLabels[st]}"></div><span class="history-link" data-cell="${cellId}" data-work="${wi}" data-flat="-" data-workname="${item}" style="font-size:0.65rem;">history</span></td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;
  }

  ssGrid.innerHTML = html;

  // Attach click events (set status)
  ssGrid.querySelectorAll('.ss-cell').forEach(cell => {
    cell.addEventListener('click', async (e) => {
      const block = cell.dataset.block;
      const wi = parseInt(cell.dataset.work);
      const status = cell.dataset.status;
      const cellId = cell.dataset.cell;
      const existing = cellsCache[cellId];
      const currentStatus = existing && existing.status ? existing.status : null;
      // Toggle: if clicking same status, clear it; otherwise set new status
      const newStatus = currentStatus === status ? null : status;
      await saveSuperStatus(block, wi, newStatus);
      renderSuperStructure();
    });
    // Right-click opens timeline modal
    cell.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const wi = parseInt(cell.dataset.work);
      const itemName = SUPER_STRUCTURE_ITEMS[wi];
      openTimelineModal(cell.dataset.cell, wi, '-', itemName);
    });
  });

  // History link clicks
  ssGrid.querySelectorAll('.history-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      const wi = parseInt(link.dataset.work);
      const itemName = link.dataset.workname || SUPER_STRUCTURE_ITEMS[wi];
      openTimelineModal(link.dataset.cell, wi, '-', itemName);
    });
  });
}

// --- Work View Rendering ---
function renderWorkView() {
  document.querySelector('.tracker-wrapper').style.display = 'none';
  document.getElementById('summary-panel').style.display = 'none';
  workViewContainer.style.display = 'block';

  const flats = getFlatNumbers(currentFloor);
  let html = '';

  // 5 main categories
  Object.keys(WORK_CATEGORIES).forEach(cat => {
    const items = WORK_CATEGORIES[cat];
    html += renderSectionTable(cat, items, flats, false);
  });

  // Corridors
  html += renderSectionTable('CORRIDORS', CORRIDORS, ['P-004'], true);

  // Elevation Work
  html += renderSectionTable('ELEVATION WORK', ELEVATION_WORK, ['P-004'], true);

  workViewContainer.innerHTML = html;

  // Attach events
  workViewContainer.querySelectorAll('.cell-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openStatusPopup(
      btn.dataset.cell,
      parseInt(btn.dataset.work),
      isNaN(parseInt(btn.dataset.flat)) ? btn.dataset.flat : parseInt(btn.dataset.flat),
      btn.dataset.workname
    ));
  });
  workViewContainer.querySelectorAll('.history-link').forEach(link => {
    link.addEventListener('click', (e) => openTimelineModal(
      link.dataset.cell,
      parseInt(link.dataset.work),
      isNaN(parseInt(link.dataset.flat)) ? link.dataset.flat : parseInt(link.dataset.flat),
      link.dataset.workname
    ));
  });
}

function renderSectionTable(title, items, columns, isSingleCol) {
  let html = `<div class="work-view-section"><div class="section-header">${title}</div>`;
  html += '<div style="overflow-x:auto;"><table class="section-table">';

  // Header
  html += '<thead><tr><th>S.No</th><th>Work Description</th>';
  for (const col of columns) {
    html += `<th>${col}</th>`;
  }
  html += '</tr></thead><tbody>';

  // Rows
  items.forEach((item, wi) => {
    html += `<tr><td>${wi + 1}</td><td>${item}</td>`;
    for (const col of columns) {
      let cellId;
      if (isSingleCol) {
        const slug = title.toLowerCase().replace(/\s+/g, '_');
        cellId = `${currentBlock}_floor${currentFloor}_${slug}_${wi}`;
      } else {
        cellId = getWorkViewCellId(currentBlock, currentFloor, title, wi, col);
      }
      const cell = cellsCache[cellId];
      const color = cell && cell.color ? cell.color : null;
      const colorClass = color ? color : '';
      html += `<td>
        <div class="cell-btn ${colorClass}" data-cell="${cellId}" data-work="${wi}" data-flat="${col}" data-workname="${item}"></div>
        <span class="history-link" data-cell="${cellId}" data-work="${wi}" data-flat="${col}" data-workname="${item}">history</span>
      </td>`;
    }
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  return html;
}

// --- Block / Floor Tabs ---
document.querySelectorAll('.block-tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.block-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentBlock = tab.dataset.block;
    updateBlockClass();
    showLoading(true);
    await loadAllCells();
    if (currentView === 'work') {
      renderWorkView();
    } else if (currentView === 'super') {
      renderSuperStructure();
    } else {
      renderTracker();
      renderSummary();
    }
    showLoading(false);
  });
});

document.querySelectorAll('.floor-tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.floor-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFloor = parseInt(tab.dataset.floor);
    showLoading(true);
    await loadAllCells();
    if (currentView === 'work') {
      renderWorkView();
    } else if (currentView === 'super') {
      renderSuperStructure();
    } else {
      renderTracker();
      renderSummary();
    }
    showLoading(false);
  });
});

// --- View Toggle ---
document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentView = tab.dataset.view;
    showLoading(true);
    await loadAllCells();
    if (currentView === 'work') {
      renderWorkView();
    } else if (currentView === 'super') {
      renderSuperStructure();
    } else {
      renderTracker();
      renderSummary();
    }
    showLoading(false);
  });
});

// --- Status Popup ---
function openStatusPopup(cellId, workIndex, flatNum, workName = null) {
  selectedCellId = cellId;
  selectedWorkIndex = workIndex;
  selectedFlatNum = flatNum;
  selectedColor = null;

  const name = workName || workItems[workIndex] || 'Unknown';
  popupTitle.textContent = `Flat ${flatNum} - ${name}`;
  popupSub.textContent = `${currentBlock} Block | ${currentFloor}${getOrdinal(currentFloor)} Floor`;

  const cell = cellsCache[cellId];
  const current = cell && cell.color ? STATUS_LABELS[cell.color] : 'No status';
  popupCurrent.textContent = `Current status: ${current}`;

  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.classList.remove('selected');
    opt.onclick = () => {
      selectedColor = opt.dataset.color;
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    };
  });

  statusPopup.classList.add('active');
}

popupCancel.addEventListener('click', () => statusPopup.classList.remove('active'));

popupClear.addEventListener('click', async () => {
  await saveCellStatus(selectedCellId, null, selectedWorkIndex, selectedFlatNum);
  statusPopup.classList.remove('active');
  if (currentView === 'work') renderWorkView();
  else if (currentView === 'super') renderSuperStructure();
  else renderTracker();
});

popupSave.addEventListener('click', async () => {
  if (selectedColor) {
    await saveCellStatus(selectedCellId, selectedColor, selectedWorkIndex, selectedFlatNum);
  }
  statusPopup.classList.remove('active');
  if (currentView === 'work') renderWorkView();
  else if (currentView === 'super') renderSuperStructure();
  else renderTracker();
});

// --- Timeline Modal ---
async function openTimelineModal(cellId, workIndex, flatNum, workName = null) {
  selectedCellId = cellId;
  selectedWorkIndex = workIndex;
  selectedFlatNum = flatNum;

  const name = workName || workItems[workIndex] || 'Unknown';
  modalTitle.textContent = `Flat ${flatNum} - ${name}`;
  modalSub.textContent = `${currentBlock} Block | ${currentFloor}${getOrdinal(currentFloor)} Floor`;

  const cell = await getCellData(cellId);
  const timeline = cell && cell.timeline ? cell.timeline : [];

  if (timeline.length === 0) {
    timelineList.innerHTML = '<div style="color:#888; text-align:center; padding:20px;">No history yet</div>';
  } else {
    // Sort by timestamp descending
    const sorted = [...timeline].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    timelineList.innerHTML = sorted.map(entry => {
      const color = entry.color || 'null';
      const dotClass = color === 'null' ? '' : (entry.color || '');
      return `<div class="timeline-item">
        <div class="timeline-dot ${dotClass}"></div>
        <div class="timeline-info">
          <strong>${entry.status_label || 'Cleared'}</strong>
          <div class="timeline-meta">${entry.date || ''} — changed by: ${entry.changed_by || ''}</div>
        </div>
      </div>`;
    }).join('');
  }

  modalRemarks.value = cell && cell.remarks ? cell.remarks : '';
  timelineModal.classList.add('active');
}

modalClose.addEventListener('click', () => timelineModal.classList.remove('active'));

modalSave.addEventListener('click', async () => {
  await saveCellRemarks(selectedCellId, modalRemarks.value.trim());
  timelineModal.classList.remove('active');
  if (currentView === 'work') renderWorkView();
  else if (currentView === 'super') renderSuperStructure();
  else renderTracker();
});

// --- Settings Page ---
settingsBtn.addEventListener('click', () => {
  dashboard.style.display = 'none';
  settingsPage.style.display = 'block';
  renderWorkList();
});

backBtn.addEventListener('click', () => {
  settingsPage.style.display = 'none';
  dashboard.style.display = 'block';
  if (currentView === 'work') renderWorkView();
  else if (currentView === 'super') renderSuperStructure();
  else renderTracker();
});

function renderWorkList() {
  workList.innerHTML = '';
  workItems.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'work-item-row';
    row.innerHTML = `
      <span class="drag-handle">&#8942;&#8942;</span>
      <input type="text" class="work-item-input" value="${item}" data-index="${idx}">
      <button class="delete-btn" data-index="${idx}">Delete</button>
    `;
    workList.appendChild(row);
  });

  workList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      workItems.splice(idx, 1);
      renderWorkList();
    });
  });
}

addWorkBtn.addEventListener('click', () => {
  workItems.push('New Work Item');
  renderWorkList();
});

saveSettingsBtn.addEventListener('click', async () => {
  showLoading(true);
  await saveWorkItems();
  showLoading(false);
  alert('Work items saved!');
});

// --- Helpers ---
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function showLoading(show) {
  if (show) loading.classList.add('active');
  else loading.classList.remove('active');
}

// Keyboard shortcuts
statusPopup.addEventListener('keydown', (e) => { if (e.key === 'Escape') statusPopup.classList.remove('active'); });
timelineModal.addEventListener('keydown', (e) => { if (e.key === 'Escape') timelineModal.classList.remove('active'); });
