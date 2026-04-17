# TaskBloom Functionalities 🌸

This document provides a comprehensive overview of all features and functionalities in TaskBloom, including technical details on how each feature works internally.

## Table of Contents

1. [Core Task Management](#core-task-management)
2. [Task Filtering & Sorting](#task-filtering--sorting)
3. [Gamification System](#gamification-system)
4. [Dual UI Modes](#dual-ui-modes)
5. [Data Persistence](#data-persistence)
6. [API Architecture](#api-architecture)

---

## Core Task Management

### 1. Create Task

**What it does:**
Users can create new tasks by entering a title, selecting priority, and optionally setting a due date.

**How it works internally:**

1. User enters task title in the input field and clicks "+ Add Task" or presses Enter
2. Frontend collects: `title`, `priority`, `due`, and `done` status
3. `handleAddTask()` function is triggered in `frontend/src/app.js`
4. Data is sent to the backend via HTTP POST request to `/api/tasks`
5. Backend receives the request in `backend/routes/tasks.js`
6. Input validation: Title must not be empty (trimmed)
7. MongoDB creates a new document using the Task schema
8. Backend returns the saved task with a unique `_id` (MongoDB ObjectID)
9. Frontend adds the new task to the state and re-renders the UI
10. Input fields are cleared for quick entry

**Request Example:**
```javascript
POST /api/tasks
{
  "title": "Design wireframes",
  "priority": "high",
  "due": "2025-05-01",
  "done": false
}
```

**Response:**
```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Design wireframes",
  "priority": "high",
  "due": "2025-05-01",
  "done": false,
  "createdAt": "2025-04-17T10:30:00.000Z",
  "updatedAt": "2025-04-17T10:30:00.000Z"
}
```

---

### 2. Read Tasks

**What it does:**
Fetches all tasks from the database and displays them in the UI.

**How it works internally:**

1. Application initializes by calling `loadLocal()` to restore saved user progress
2. Then `fetchTasks()` is called to retrieve tasks from the backend
3. Frontend sends HTTP GET request to `/api/tasks`
4. Backend queries MongoDB using `Task.find()` and sorts by `createdAt` descending (newest first)
5. If the backend is unreachable, a fallback loads demo data to allow offline testing
6. Tasks are stored in the app's state: `state.tasks = [...]`
7. `render()` function is called to update the UI with the fetched tasks
8. Tasks are displayed as individual task cards in the task list

**Request:**
```
GET /api/tasks
```

**Response:**
```javascript
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Design wireframes",
    "priority": "high",
    "due": "2025-05-01",
    "done": false,
    "createdAt": "2025-04-17T10:30:00.000Z"
  },
  // ... more tasks
]
```

---

### 3. Update Task (Toggle Completion)

**What it does:**
Marks a task as complete/incomplete by clicking the checkbox button.

**How it works internally:**

1. User clicks the circular checkbox button on a task card
2. `handleToggle(id)` function is triggered with the task's MongoDB `_id`
3. Frontend finds the task in the state by `_id`
4. **If task is being marked complete:**
   - `done` status changes to `true`
   - `petalCount` is incremented by 1 (flower grows a petal)
   - XP is added: `addXP(20)` points
   - Confetti animation spawns (if in Arcade mode)
5. **If task is being marked incomplete:**
   - `done` status changes to `false`
   - No XP or petals are added/removed
6. Frontend sends HTTP PUT request to backend with updated task data
7. Backend uses `Task.findByIdAndUpdate()` to update MongoDB document
8. Backend returns the updated task
9. Frontend re-renders the UI to reflect changes
10. `saveLocal()` is called to persist user progress to browser localStorage

**Request:**
```javascript
PUT /api/tasks/507f1f77bcf86cd799439011
{
  "done": true
}
```

**Response:**
```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Design wireframes",
  "priority": "high",
  "due": "2025-05-01",
  "done": true,
  "updatedAt": "2025-04-17T11:30:00.000Z"
}
```

---

### 4. Delete Task

**What it does:**
Removes a task from the database and UI.

**How it works internally:**

1. User clicks the "✕" button on a task card
2. `handleDelete(id)` function is triggered
3. Task is immediately removed from the frontend state (optimistic update)
4. UI is re-rendered without the deleted task
5. Frontend sends HTTP DELETE request to `/api/tasks/{id}`
6. Backend receives the DELETE request in `routes/tasks.js`
7. Backend uses `Task.findByIdAndDelete()` to remove the document from MongoDB
8. Backend returns confirmation with the deleted task's ID
9. If the request fails (offline), the task remains in the frontend state but wasn't persisted to DB
10. `saveLocal()` updates localStorage with the new state

**Request:**
```
DELETE /api/tasks/507f1f77bcf86cd799439011
```

**Response:**
```javascript
{
  "message": "Task deleted",
  "id": "507f1f77bcf86cd799439011"
}
```

---

## Task Filtering & Sorting

### 5. Filter Tasks by Status

**What it does:**
Users can view tasks filtered by their completion status: All, Active (incomplete), or Done (completed).

**How it works internally:**

1. User clicks one of the filter buttons: "All", "Active", or "Done"
2. `handleFilter(f)` updates `state.filter` to the selected value
3. `render()` function is called
4. Inside render, tasks are filtered using the `Array.filter()` method:
   - **All**: Returns all tasks (`state.tasks`)
   - **Active**: Returns only tasks where `done === false`
   - **Done**: Returns only tasks where `done === true`
5. The filtered task list is stored in the `visible` array
6. Only `visible` tasks are rendered to the UI
7. Filter buttons display dynamic counts: "All (5)", "Active (2)", "Done (3)"
8. Active filter button is highlighted with the "active" CSS class

**Filter Logic:**
```javascript
let visible = state.tasks.filter(t => {
  if (state.filter === 'active') return !t.done;
  if (state.filter === 'done')   return t.done;
  return true; // 'all'
});
```

---

### 6. Sort Tasks

**What it does:**
Users can sort tasks by: Default (newest first), Priority (High → Medium → Low), or Due Date (earliest first).

**How it works internally:**

1. User clicks the "Sort: [Current Sort] ↕" button
2. `handleCycleSort()` cycles through sort options: `['none', 'priority', 'due']`
3. `state.sort` is updated to the next sort mode
4. `render()` function is called
5. After filtering, tasks are sorted based on `state.sort`:
   - **none**: Natural order (newest first by default from API)
   - **priority**: Sorted by priority order using `PRIORITY_ORDER` object:
     - High (0) comes before Medium (1) comes before Low (2)
   - **due**: Sorted alphabetically by due date string (empty dates come last)
6. Sorted `visible` array is used to render tasks
7. Sort button displays current sort mode label: "Default", "Priority", or "Due Date"

**Sort Logic:**
```javascript
const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };

visible = [...visible].sort((a, b) => {
  if (state.sort === 'priority') {
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  }
  if (state.sort === 'due') {
    return (a.due || 'zzz').localeCompare(b.due || 'zzz');
  }
  return 0; // default
});
```

---

## Gamification System

### 7. XP (Experience Points) & Leveling

**What it does:**
Users earn XP for completing tasks and level up when reaching 100 XP per level.

**How it works internally:**

1. When a task is marked as complete:
   - `addXP(20)` is called, adding 20 XP to `state.xp`
2. The `addXP()` function checks if total XP exceeds the level threshold (100 XP per level)
3. For each complete 100 XP:
   - XP is reduced by 100: `state.xp -= 100`
   - Level increases: `state.level++`
4. Process repeats until XP is below 100
5. XP bar is displayed showing: `[current XP] / 100 XP`
6. XP bar width is calculated as: `(state.xp / 100) * 100%`
7. Level badge displays: "⚡ Level [current level]"
8. Data is persisted to localStorage via `saveLocal()`

**Example:**
- Start: Level 1, 0 XP
- Complete 5 tasks (5 × 20 XP = 100 XP)
- Result: Level 2, 0 XP
- Complete 3 more tasks (3 × 20 XP = 60 XP)
- Result: Level 2, 60 XP

**XP Logic:**
```javascript
function addXP(amount) {
  state.xp += amount;
  while (state.xp >= XP_PER_LEVEL) {  // 100
    state.xp -= XP_PER_LEVEL;
    state.level++;
  }
}
```

---

### 8. Flower Blooming System

**What it does:**
A visual flower grows petals as users complete tasks. The flower has a maximum of 12 visible petals.

**How it works internally:**

1. Each time a task is marked complete, `petalCount` is incremented: `state.petalCount++`
2. Petals are displayed from 0 to 12 maximum
3. The flower SVG is dynamically generated using the `buildFlowerSVG()` function:
   - Takes `petalCount` as input
   - Creates an SVG visualization with stem, leaves, and petals
4. Each petal is an ellipse element rotated around the flower center
5. **Petal colors** cycle through 12 predefined colors: pink, purple, blue, green, yellow, red, etc.
6. **Color allocation**: `PETAL_COLORS[i % PETAL_COLORS.length]`
7. **Rotation**: Each petal is rotated by `angleStep * i` degrees
   - `angleStep = 360 / Math.max(petalCount, 6)`
8. **Styling changes** based on mode:
   - **Zen Mode**: Softer colors, subtle shadows
   - **Arcade Mode**: Brighter colors with neon glow effect
9. The flower section displays: "🌸 Your Bloom — [petal count] petals grown"
10. Even after 12 petals are visible, `petalCount` continues to increment (internal counter)

**Flower SVG Structure:**
```
- Soil circle (base)
- Stem (line)
- Two leaves (ellipses)
- Petals (rotated ellipses, colored)
- Center circle with ring (flower center)
```

**Petal Colors:**
```javascript
const PETAL_COLORS = [
  '#e879f9',  // Pink
  '#a78bfa',  // Purple
  '#60a5fa',  // Blue
  '#34d399',  // Green
  '#fbbf24',  // Yellow
  '#f87171',  // Red
  '#c084fc',  // Light Purple
  '#38bdf8',  // Cyan
  '#86efac',  // Light Green
  '#fde68a',  // Light Yellow
  '#fca5a5',  // Light Red
  '#d8b4fe'   // Lavender
];
```

---

### 9. Streak Tracking

**What it does:**
Tracks the user's consecutive days of using the application. The streak increments by 1 each day and resets if a day is missed.

**How it works internally:**

1. When the app starts, `loadLocal()` retrieves saved data from browser localStorage
2. Current date is obtained: `const today = new Date().toDateString()`
3. Last visit date is retrieved from localStorage: `const last = data.lastVisit`
4. **Streak calculation logic:**
   - **Same day**: If `lastVisit === today`, streak remains unchanged
   - **Next day**: If the difference is exactly 1 day, streak is incremented by 1
   - **Skipped day**: If more than 1 day has passed, streak resets to 1
5. Streak is displayed in stats bar: "[streak count]🔥"
6. `saveLocal()` updates `lastVisit` to today whenever state changes
7. On next app visit, the logic re-evaluates the streak

**Streak Logic:**
```javascript
const today = new Date().toDateString();
const last = data.lastVisit;

if (last === today) {
  state.streak = data.streak || 0;
} else {
  const diff = (new Date(today) - new Date(last)) / 86400000;  // Days difference
  state.streak = diff === 1 ? (data.streak || 0) + 1 : 1;
}
```

---

### 10. Confetti Animation

**What it does:**
When a task is marked complete in Arcade Mode, colorful confetti particles animate across the screen to celebrate.

**How it works internally:**

1. `handleToggle()` calls `spawnConfetti()` when a task is marked complete
2. `spawnConfetti()` first checks if Arcade Mode is enabled (returns early if not)
3. Creates a container `div#confetti-stage` (already in HTML)
4. 50 confetti dots are created as individual `<div>` elements
5. **For each dot:**
   - Random horizontal position: `left: Math.random() * 100%`
   - Random color selected from 6 arcade colors
   - Random animation delay: `0 to 0.6s`
   - Random animation duration: `0.8s to 1.7s`
   - Applied CSS class: `c-dot` (defines animation)
6. CSS animation makes dots fall from top to bottom with opacity fade
7. After animation completes (2.2 seconds), dots are removed from DOM: `setTimeout(() => dot.remove(), 2200)`
8. Multiple confetti animations can overlap if tasks complete quickly

**Confetti Dots Styling (CSS):**
```css
.c-dot {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    top: -10px;
    opacity: 1;
  }
  100% {
    top: 100vh;
    opacity: 0;
  }
}
```

---

## Dual UI Modes

### 11. Zen Mode (Default)

**What it does:**
A calm, minimalist interface with soft colors and light styling designed for focused productivity.

**Visual Characteristics:**
- **Background**: Light beige (#f8f7f4)
- **Surface**: White (#ffffff)
- **Text**: Dark gray (#1a1a1a)
- **Accent**: Purple (#7c6af7)
- **Flower**: Soft colors with subtle shadows
- **Animations**: Smooth transitions at 0.4s cubic-bezier

**How it works:**

1. Default mode when app loads (`state.arcadeMode = false`)
2. CSS variables set to Zen color scheme from `:root`
3. Flower SVG uses softer colors and opacity values
4. No pulse animations on buttons
5. Mode toggle button shows: "🎮 Arcade Mode"

---

### 12. Arcade Mode

**What it does:**
A vibrant, gamified interface with dark background and neon colors designed for maximum engagement.

**Visual Characteristics:**
- **Background**: Dark navy (#0d0d1a)
- **Surface**: Dark purple (#13132a)
- **Text**: Light purple (#f0eeff)
- **Accent**: Bright purple (#b06ef3)
- **Flower**: Bright colors with neon glow effects
- **Animations**: Pulse ring animations on buttons
- **Confetti**: Triggered on task completion

**How it works:**

1. User clicks "🎮 Arcade Mode" button
2. `handleToggleMode()` toggles `state.arcadeMode` boolean
3. `render()` applies class to HTML element: `document.documentElement.className = 'arcade'`
4. CSS `.arcade` class overrides color variables via CSS cascade
5. Flower SVG receives arcade styling:
   - Brighter petal colors
   - `opacity: 0.92` (more opaque than Zen's 0.72)
   - `filter: drop-shadow(0 0 5px [color])` for neon glow
6. Buttons get `pulse-ring` animation (2s infinite)
7. Mode toggle button shows: "🧘 Zen Mode"
8. Confetti animations are now enabled
9. `saveLocal()` persists arcade mode preference to localStorage
10. On next app visit, user's preferred mode is restored

**Mode Toggle Logic:**
```javascript
function handleToggleMode() {
  state.arcadeMode = !state.arcadeMode;
  render();
}

// In render():
document.documentElement.className = state.arcadeMode ? 'arcade' : '';
```

---

## Data Persistence

### 13. Browser LocalStorage (Client-side)

**What it does:**
Saves user progress, preferences, and statistics to the browser's localStorage so data persists between sessions.

**Persisted Data:**
```javascript
{
  "arcadeMode": boolean,      // UI mode preference
  "xp": number,               // Current XP
  "level": number,            // Current level
  "streak": number,           // Current streak
  "petalCount": number,       // Total petals earned
  "lastVisit": "string"       // Last visit date (for streak tracking)
}
```

**How it works internally:**

1. `saveLocal()` is called after every state change (task added/deleted/toggled, mode changed)
2. Creates a data object with user progress metadata
3. Converts object to JSON string: `JSON.stringify(data)`
4. Stores in localStorage: `localStorage.setItem('taskbloom_meta', jsonString)`
5. Error is silently caught if storage quota exceeded

**Loading data:**

1. `loadLocal()` is called when app initializes
2. Retrieves data: `JSON.parse(localStorage.getItem('taskbloom_meta'))`
3. Restores: `arcadeMode`, `xp`, `level`, `petalCount`
4. Calculates streak based on date difference (see Streak Tracking section)
5. If no saved data exists, defaults to initial state

**localStorage Logic:**
```javascript
function saveLocal() {
  const data = {
    arcadeMode: state.arcadeMode,
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    petalCount: state.petalCount,
    lastVisit: new Date().toDateString(),
  };
  try {
    localStorage.setItem('taskbloom_meta', JSON.stringify(data));
  } catch(e) {}  // Silently fail if quota exceeded
}

function loadLocal() {
  try {
    const raw = localStorage.getItem('taskbloom_meta');
    if (!raw) return;
    const data = JSON.parse(raw);
    // Restore state...
  } catch(e) {}
}
```

---

### 14. MongoDB Database (Server-side)

**What it does:**
Persists all task data on the server using MongoDB, ensuring data survives browser cache clears and is accessible across devices.

**How it works internally:**

1. Express server connects to MongoDB on startup using Mongoose
2. Connection string from `.env` file: `MONGO_URI`
3. Tasks are stored as documents in the `tasks` collection
4. **Create**: `Task.create()` inserts new document
5. **Read**: `Task.find()` retrieves all documents
6. **Update**: `Task.findByIdAndUpdate()` modifies existing document
7. **Delete**: `Task.findByIdAndDelete()` removes document
8. Each document has auto-generated `_id` (MongoDB ObjectID)
9. Timestamps are auto-added: `createdAt` and `updatedAt`
10. Data is persisted even if browser is cleared

**Task Schema (MongoDB):**
```javascript
{
  _id: ObjectID,
  title: String (required, max 120 chars),
  priority: String ('high' | 'med' | 'low', default: 'med'),
  due: String (YYYY-MM-DD format, optional),
  done: Boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## API Architecture

### 15. REST API Endpoints

**What it does:**
Provides HTTP endpoints for the frontend to perform CRUD operations on tasks.

**Endpoints Overview:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks` | Fetch all tasks |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

**How it works internally:**

1. Frontend makes HTTP requests using Fetch API
2. Requests include method, headers, and JSON body data
3. Express routes receive requests in `backend/routes/tasks.js`
4. Each route handler:
   - Validates input (if applicable)
   - Interacts with MongoDB via Mongoose
   - Returns JSON response with status code
   - Catches errors and returns error message

**GET /api/tasks (Fetch All)**

```javascript
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});
```

- Sorts by `createdAt` descending (newest first)
- Returns array of task objects
- Status code: 200 OK

**POST /api/tasks (Create)**

```javascript
router.post('/', async (req, res) => {
  const { title, priority, due, done } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const task = await Task.create({ title: title.trim(), priority, due, done });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});
```

- Validates title is not empty
- Trims whitespace from title
- Returns newly created task with `_id`
- Status codes: 201 Created, 400 Bad Request, 500 Server Error

**PUT /api/tasks/:id (Update)**

```javascript
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});
```

- Uses MongoDB `$set` operator to update only provided fields
- `new: true` returns updated document (not original)
- `runValidators: true` validates against schema
- Returns updated task object
- Status codes: 200 OK, 404 Not Found, 500 Server Error

**DELETE /api/tasks/:id (Delete)**

```javascript
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});
```

- Finds and deletes task in one operation
- Returns confirmation message with deleted task ID
- Status codes: 200 OK, 404 Not Found, 500 Server Error

---

### 16. CORS (Cross-Origin Resource Sharing)

**What it does:**
Allows the frontend running on one port (typically 3000 or browser) to make requests to the backend on another port (5000).

**How it works internally:**

1. In `backend/server.js`, CORS middleware is enabled:
   ```javascript
   app.use(cors());
   ```
2. This adds headers to all responses allowing cross-origin requests
3. Frontend can now fetch from `http://localhost:5000` without CORS errors
4. Credentials and cookies can be sent if needed

---

### 17. Error Handling & Offline Support

**What it does:**
Gracefully handles network errors and allows the app to work offline with demo data.

**How it works internally:**

1. **Fetch errors are caught** in try-catch blocks
2. **When backend is unreachable:**
   - `fetchTasks()` catches error and logs warning
   - Checks if `state.tasks` is empty
   - If empty, loads demo data: `loadDemoTasks()`
   - Demo data allows UI testing without backend
3. **When creating/updating/deleting offline:**
   - Task operations proceed optimistically (update UI immediately)
   - API call is attempted in the background
   - If it fails, data remains in frontend state
   - On reconnection, data is not automatically synced (manual refresh needed)
4. **Fallback demo tasks:**
   ```javascript
   {
     _id: 'demo1',
     title: 'Design wireframes',
     priority: 'high',
     due: '2025-05-01',
     done: false
   }
   ```

---

## Summary of Key Features

| Feature | Type | Persistence | User Benefit |
|---------|------|-------------|--------------|
| Task CRUD | Core | Database | Complete control over tasks |
| Filtering | Core | None | Organize by status |
| Sorting | Core | None | Custom task ordering |
| XP System | Gamification | localStorage | Progression tracking |
| Leveling | Gamification | localStorage | Motivation through levels |
| Flower Blooming | Gamification | localStorage | Visual progress indicator |
| Streak | Gamification | localStorage | Habit formation |
| Confetti | Gamification | None | Celebration animation |
| Zen/Arcade Modes | UI | localStorage | User preference |
| Responsive Design | UI | None | Works on all devices |

---

**TaskBloom combines productivity with engagement, making task management both effective and enjoyable!** 🌸
