const API_BASE = 'http://localhost:5000/api/tasks';

// =========== STATE ===========
let state = {
  tasks: [],
  filter: 'all',      // 'all' | 'active' | 'done'
  sort: 'none',        // 'none' | 'priority' | 'due'
  arcadeMode: false,
  xp: 0,
  level: 1,
  streak: 0,
  petalCount: 0,
  nextLocalId: 100,
};

const XP_PER_LEVEL = 100;
const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };
const PETAL_COLORS = [
  '#e879f9','#a78bfa','#60a5fa','#34d399','#fbbf24',
  '#f87171','#c084fc','#38bdf8','#86efac','#fde68a','#fca5a5','#d8b4fe'
];

// =========== PERSISTENCE ===========
function saveLocal() {
  const data = {
    arcadeMode: state.arcadeMode,
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    petalCount: state.petalCount,
    lastVisit: new Date().toDateString(),
  };
  try { localStorage.setItem('taskbloom_meta', JSON.stringify(data)); } catch(e) {}
}

function loadLocal() {
  try {
    const raw = localStorage.getItem('taskbloom_meta');
    if (!raw) return;
    const data = JSON.parse(raw);
    state.arcadeMode = data.arcadeMode || false;
    state.xp         = data.xp || 0;
    state.level      = data.level || 1;
    state.petalCount = data.petalCount || 0;

    // Streak: increment if last visit was yesterday
    const today = new Date().toDateString();
    const last  = data.lastVisit;
    if (last === today) {
      state.streak = data.streak || 0;
    } else {
      const diff = (new Date(today) - new Date(last)) / 86400000;
      state.streak = diff === 1 ? (data.streak || 0) + 1 : 1;
    }
  } catch(e) {}
}

// =========== API CALLS ===========
async function fetchTasks() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Server error');
    state.tasks = await res.json();
  } catch (e) {
    console.warn('Backend not reachable – using demo data.', e.message);
    if (state.tasks.length === 0) loadDemoTasks();
  }
  render();
}

function loadDemoTasks() {
  state.tasks = [
    { _id: 'demo1', title: 'Design wireframes', priority: 'high', due: '2025-05-01', done: false },
    { _id: 'demo2', title: 'Set up MERN backend', priority: 'med', due: '2025-05-05', done: false },
    { _id: 'demo3', title: 'Write documentation', priority: 'low', due: '', done: true },
  ];
}

async function apiAddTask(task) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { ...task, _id: 'local_' + (state.nextLocalId++) };
  }
}

async function apiToggleTask(id, done) {
  try {
    await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
  } catch { /* offline – state already updated */ }
}

async function apiDeleteTask(id) {
  try {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  } catch { /* offline */ }
}

// =========== XP / GAMIFICATION ===========
function addXP(amount) {
  state.xp += amount;
  while (state.xp >= XP_PER_LEVEL) {
    state.xp -= XP_PER_LEVEL;
    state.level++;
  }
}

// =========== CONFETTI ===========
function spawnConfetti() {
  if (!state.arcadeMode) return;
  const stage = document.getElementById('confetti-stage');
  const colors = ['#b06ef3','#e879f9','#38bdf8','#4ade80','#fbbf24','#f87171'];
  for (let i = 0; i < 50; i++) {
    const dot = document.createElement('div');
    dot.className = 'c-dot';
    dot.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.6}s;
      animation-duration: ${0.8 + Math.random() * 0.9}s;
    `;
    stage.appendChild(dot);
    setTimeout(() => dot.remove(), 2200);
  }
}

// =========== FLOWER SVG ===========
function buildFlowerSVG(petalCount) {
  const shown = Math.min(petalCount, 12);
  const isArcade = state.arcadeMode;
  const stemColor  = isArcade ? '#4ade80' : '#86efac';
  const leafColor  = isArcade ? '#4ade80' : '#a7f3d0';
  const soilColor  = isArcade ? '#2d2d55' : '#e0ddd6';
  const centerFill = isArcade ? '#fbbf24' : '#fde68a';
  const centerRing = isArcade ? '#f59e0b' : '#fbbf24';

  let petals = '';
  if (shown > 0) {
    const angleStep = 360 / Math.max(shown, 6);
    for (let i = 0; i < shown; i++) {
      const angle = angleStep * i;
      const color = PETAL_COLORS[i % PETAL_COLORS.length];
      const glow  = isArcade ? `filter: drop-shadow(0 0 5px ${color});` : '';
      petals += `
        <ellipse
          cx="0" cy="-28" rx="9" ry="17"
          fill="${color}" opacity="${isArcade ? 0.92 : 0.72}"
          transform="rotate(${angle})"
          style="${glow}"
        />`;
    }
  }

  const centerCircles = shown > 0 ? `
    <circle cx="0" cy="0" r="14" fill="${centerFill}" stroke="${centerRing}" stroke-width="2"/>
    <circle cx="0" cy="0" r="7" fill="${centerRing}" opacity="0.55"/>
  ` : `<circle cx="0" cy="55" r="6" fill="${leafColor}" opacity="0.4"/>`;

  return `
    <svg viewBox="-65 -65 130 130" width="120" height="120" xmlns="http://www.w3.org/2000/svg" aria-label="Flower with ${shown} petals">
      <ellipse cx="0" cy="62" rx="22" ry="6" fill="${soilColor}" opacity="0.5"/>
      <line x1="0" y1="10" x2="0" y2="58" stroke="${stemColor}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="-12" cy="28" rx="10" ry="6" fill="${leafColor}" opacity="0.65" transform="rotate(-30 -12 28)"/>
      ${petals}
      ${centerCircles}
    </svg>`;
}

// =========== RENDER ===========
function render() {
  // Apply mode class on html element
  document.documentElement.className = state.arcadeMode ? 'arcade' : '';

  // Filter
  let visible = state.tasks.filter(t => {
    if (state.filter === 'active') return !t.done;
    if (state.filter === 'done')   return t.done;
    return true;
  });

  // Sort
  visible = [...visible].sort((a, b) => {
    if (state.sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (state.sort === 'due')      return (a.due || 'zzz').localeCompare(b.due || 'zzz');
    return 0; // default: natural order
  });

  const total     = state.tasks.length;
  const doneCount = state.tasks.filter(t => t.done).length;
  const active    = total - doneCount;
  const xpPct     = Math.round((state.xp / XP_PER_LEVEL) * 100);
  const petalShown = Math.min(state.petalCount, 12);
  const sortLabel  = state.sort === 'none' ? 'Default' : state.sort === 'priority' ? 'Priority' : 'Due Date';

  // Build task cards HTML
  const taskCardsHTML = visible.length
    ? visible.map(t => {
        const id  = t._id;
        const pClass = `p-${t.priority}`;
        const pLabel = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
        return `
          <div class="task-card ${t.done ? 'done' : ''}">
            <button class="check-btn ${t.done ? 'checked' : ''}" onclick="handleToggle('${id}')" aria-label="${t.done ? 'Mark incomplete' : 'Mark complete'}">
              ${t.done ? '✓' : ''}
            </button>
            <div class="task-body">
              <div class="task-title">${escapeHTML(t.title)}</div>
              <div class="task-meta">
                <span class="badge ${pClass}">${pLabel}</span>
                ${t.due ? `<span class="date-tag"> ${t.due}</span>` : ''}
              </div>
            </div>
            <button class="del-btn" onclick="handleDelete('${id}')" aria-label="Delete task">✕</button>
          </div>`;
      }).join('')
    : `<div class="empty-state">
         <div class="empty-icon">🌱</div>
         <div class="empty-msg">No tasks here. Add one to make your flower bloom!</div>
       </div>`;

  // Mount full app HTML
  document.getElementById('root').innerHTML = `
    <div class="app-wrap">

      <!-- HEADER -->
      <div class="header">
        <div class="logo">Task<span class="accent">Bloom</span> </div>
        <button class="mode-toggle" onclick="handleToggleMode()" aria-label="Toggle design mode">
          ${state.arcadeMode ? ' Zen Mode' : ' Arcade Mode'}
        </button>
      </div>

      <!-- STATS -->
      <div class="stats-bar" role="region" aria-label="Statistics">
        <div class="stat-card">
          <span class="stat-val">${total}</span>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card">
          <span class="stat-val">${doneCount}</span>
          <div class="stat-label">Done</div>
        </div>
        <div class="stat-card">
          <span class="stat-val">${state.streak}</span>
          <div class="stat-label">Streak</div>
        </div>
      </div>

      <!-- XP BAR -->
      <div class="xp-section">
        <div class="xp-top">
          <span class="xp-level"> Level ${state.level}</span>
          <span>${state.xp} / ${XP_PER_LEVEL} XP</span>
        </div>
        <div class="xp-track">
          <div class="xp-fill" style="width:${xpPct}%"></div>
        </div>
      </div>

      <!-- FLOWER -->
      <div class="flower-section" role="region" aria-label="Flower growth tracker">
        <div class="flower-heading"> Your Bloom — ${petalShown} petal${petalShown !== 1 ? 's' : ''} grown</div>
        <div class="flower-svg-container">${buildFlowerSVG(state.petalCount)}</div>
        <div class="flower-caption">Complete tasks to grow petals (max 12 visible)</div>
      </div>

      <!-- ADD TASK -->
      <div class="add-section">
        <div class="input-row">
          <input
            class="task-input"
            id="task-title-input"
            type="text"
            placeholder="What needs to be done?"
            onkeydown="if(event.key==='Enter') handleAddTask()"
            maxlength="120"
            aria-label="Task title"
          />
        </div>
        <div class="input-row2">
          <select class="task-input" id="task-priority-input" aria-label="Task priority">
            <option value="high"> High Priority</option>
            <option value="med" selected> Medium Priority</option>
            <option value="low"> Low Priority</option>
          </select>
          <input
            class="task-input"
            id="task-due-input"
            type="date"
            aria-label="Due date"
          />
          <button class="add-btn" onclick="handleAddTask()">+ Add Task</button>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="filter-bar" role="toolbar" aria-label="Filter tasks">
        <button class="filter-btn ${state.filter === 'all'    ? 'active' : ''}" onclick="handleFilter('all')">All (${total})</button>
        <button class="filter-btn ${state.filter === 'active' ? 'active' : ''}" onclick="handleFilter('active')">Active (${active})</button>
        <button class="filter-btn ${state.filter === 'done'   ? 'active' : ''}" onclick="handleFilter('done')">Done (${doneCount})</button>
        <button class="sort-btn" onclick="handleCycleSort()">Sort: ${sortLabel} ↕</button>
      </div>

      <!-- TASK LIST -->
      <div class="task-list" role="list">
        ${taskCardsHTML}
      </div>

    </div>`;

    document.body.style.backgroundImage = state.arcadeMode
  ? "url('./mode2.jpg')"
  : "url('./mode1.jpg')";

document.body.style.backgroundSize = "cover";
document.body.style.backgroundPosition = "center";
document.body.style.backgroundRepeat = "no-repeat";

  saveLocal();
}

// =========== EVENT HANDLERS ===========
function handleToggleMode() {
  state.arcadeMode = !state.arcadeMode;
  render();
}

function handleFilter(f) {
  state.filter = f;
  render();
}

function handleCycleSort() {
  const opts = ['none', 'priority', 'due'];
  state.sort = opts[(opts.indexOf(state.sort) + 1) % opts.length];
  render();
}

async function handleAddTask() {
  const titleEl    = document.getElementById('task-title-input');
  const priorityEl = document.getElementById('task-priority-input');
  const dueEl      = document.getElementById('task-due-input');
  if (!titleEl || !titleEl.value.trim()) return;

  const newTask = {
    title:    titleEl.value.trim(),
    priority: priorityEl.value,
    due:      dueEl.value,
    done:     false,
  };

  const saved = await apiAddTask(newTask);
  state.tasks.unshift(saved);
  render();

  // Re-focus for quick entry
  document.getElementById('task-title-input').focus();
}

async function handleToggle(id) {
  const task = state.tasks.find(t => t._id === id);
  if (!task) return;
  if (!task.done) {
  task.done = true;

  state.petalCount++;
  const xpMap = { high: 30, med: 20, low: 10 };
  addXP(xpMap[task.priority]);

  //FEATURE 2: QUICK COMPLETION BONUS
  const today = new Date().toISOString().split('T')[0];
  if (task.due && task.due === today) {
    addXP(10); // bonus for completing on same day
  }

  //FEATURE 6: RANDOM SURPRISE BONUS
  if (Math.random() < 0.2) { // 20% chance
    addXP(15);
    alert("SURPRISE BONUSSS!");
  }

  spawnConfetti();

  // LEVEL SYSTEM FIX
  if (state.petalCount >= 12) {
    state.petalCount = 0;   // reset flower
    addXP(50);          
  }

} else {
  task.done = false;
   
   //FEATURE 3: UNDO PENALTY
  state.petalCount = Math.max(0, state.petalCount - 1);
  addXP(-10);

  // optional: decrease petals when undo
  state.petalCount = Math.max(0, state.petalCount - 1);
}
  await apiToggleTask(id, task.done);
  render();
}

async function handleDelete(id) {
  state.tasks = state.tasks.filter(t => t._id !== id);
  await apiDeleteTask(id);
  render();
}

// =========== UTILS ===========
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =========== INIT ===========
loadLocal();
fetchTasks();