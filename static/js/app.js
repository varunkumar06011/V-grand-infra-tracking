const STATUS_LABELS = {
  red: 'Yet to start',
  yellow: 'In progress',
  blue: 'Patch work / pending',
  green: 'Completed'
};

const DEFAULT_WORK_ITEMS = [
  'Brick work', 'Plastering', 'Electrical pipe', 'Pop bolster',
  'Bathroom plumbing', 'Baby sink lines', 'Tiles', 'Pop primer',
  'Window fitting', 'Window grills', 'Door frames', 'Door shutters',
  'Grills', 'Main door', 'Flooring', 'Wall care', 'Primer', 'Putty',
  'Paint', 'Dado tiles', 'Final coat'
];

const BLOCKS = ['A', 'B'];
const FLOORS = [1, 2, 3, 4, 5];
const FLATS_PER_FLOOR = 6;

const LOGIN_EMAIL = 'vgrand@123';
const LOGIN_PASSWORD = 'vgrand1234';

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
  renderTracker();
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

async function loadAllCells() {
  cellsCache = {};
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
      parseInt(btn.dataset.flat)
    ));
  });
  trackerBody.querySelectorAll('.history-link').forEach(link => {
    link.addEventListener('click', (e) => openTimelineModal(
      link.dataset.cell,
      parseInt(link.dataset.work),
      parseInt(link.dataset.flat)
    ));
  });
}

// --- Block / Floor Tabs ---
document.querySelectorAll('.block-tab').forEach(tab => {
  tab.addEventListener('click', async () => {
    document.querySelectorAll('.block-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentBlock = tab.dataset.block;
    showLoading(true);
    await loadAllCells();
    renderTracker();
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
    renderTracker();
    showLoading(false);
  });
});

// --- Status Popup ---
function openStatusPopup(cellId, workIndex, flatNum) {
  selectedCellId = cellId;
  selectedWorkIndex = workIndex;
  selectedFlatNum = flatNum;
  selectedColor = null;

  popupTitle.textContent = `Flat ${flatNum} - ${workItems[workIndex]}`;
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
  renderTracker();
});

popupSave.addEventListener('click', async () => {
  if (selectedColor) {
    await saveCellStatus(selectedCellId, selectedColor, selectedWorkIndex, selectedFlatNum);
  }
  statusPopup.classList.remove('active');
  renderTracker();
});

// --- Timeline Modal ---
async function openTimelineModal(cellId, workIndex, flatNum) {
  selectedCellId = cellId;
  selectedWorkIndex = workIndex;
  selectedFlatNum = flatNum;

  modalTitle.textContent = `Flat ${flatNum} - ${workItems[workIndex]}`;
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
  renderTracker();
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
  renderTracker();
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
