const sessions = JSON.parse(localStorage.getItem("focusSessions")) || [];
const successfulSessions = sessions.filter(s => s.success);

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split("T")[0];

// ── SUMMARY ──────────────────────────────────────────
const totalMinutes = successfulSessions.reduce((sum, s) => sum + s.duration, 0);

document.getElementById("total-focus-time").textContent =
  totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : `${totalMinutes}m`;

document.getElementById("total-sessions").textContent = successfulSessions.length;
document.getElementById("total-trees").textContent = successfulSessions.length;

const categoryMap = {};
successfulSessions.forEach(s => {
  categoryMap[s.category] = (categoryMap[s.category] || 0) + s.duration;
});
let topCategory = "—";
let maxCat = 0;
for (const cat in categoryMap) {
  if (categoryMap[cat] > maxCat) { maxCat = categoryMap[cat]; topCategory = cat; }
}
document.getElementById("top-category").textContent = topCategory;

// ── BUILD dailyMap (date string → minutes) ───────────
const dailyMap = {};
successfulSessions.forEach(s => {
  dailyMap[s.date] = (dailyMap[s.date] || 0) + s.duration;
});

function getLevel(minutes, maxMins) {
  if (!minutes || !maxMins) return 0;
  const ratio = minutes / maxMins;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5)  return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// ── HEATMAP STATE ─────────────────────────────────────
let currentView = "monthly";
let viewYear  = today.getFullYear();
let viewMonth = today.getMonth(); // 0-indexed

function switchView(view) {
  currentView = view;

  // update tab styles
  document.querySelectorAll(".heatmap-tab").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");

  // show/hide nav & day labels for monthly only
  document.getElementById("heatmap-nav").style.display = view === "monthly" ? "flex" : "none";
  document.getElementById("day-labels-row").style.display = view === "monthly" ? "grid" : "none";

  renderHeatmap();
}

function navigateMonth(dir) {
  viewMonth += dir;
  if (viewMonth > 11) { viewMonth = 0;  viewYear++; }
  if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
  renderHeatmap();
}

function renderHeatmap() {
  if (currentView === "monthly") renderMonthly();
  else renderYearly();
}

// ── MONTHLY HEATMAP ───────────────────────────────────
function renderMonthly() {
  const grid = document.getElementById("heatmap-grid");
  grid.className = "heatmap-grid";
  grid.innerHTML = "";

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById("nav-label").textContent = `${MONTHS[viewMonth]} ${viewYear}`;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  // get max for this month to scale levels
  const monthMins = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    monthMins.push(dailyMap[ds] || 0);
  }
  const maxMins = Math.max(...monthMins);

  // filler cells for offset
  for (let i = 0; i < firstDay; i++) {
    const filler = document.createElement("div");
    filler.className = "hm-cell filler";
    grid.appendChild(filler);
  }

  // day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const mins = dailyMap[ds] || 0;
    const level = getLevel(mins, maxMins);

    const cell = document.createElement("div");
    cell.className = `hm-cell l${level}`;
    if (ds === todayStr) cell.classList.add("today");
    cell.setAttribute("data-tip", mins ? `${ds}: ${mins}m` : ds);
    grid.appendChild(cell);
  }
}

// ── YEARLY HEATMAP (GitHub / LeetCode style) ──────────
function renderYearly() {
  const grid = document.getElementById("heatmap-grid");
  grid.className = "heatmap-grid yearly";
  grid.innerHTML = "";

  // show year label in nav area
  document.getElementById("nav-label").textContent = viewYear;

  // year start = Jan 1 of viewYear
  const yearStart = new Date(viewYear, 0, 1);
  const yearEnd   = new Date(viewYear, 11, 31);

  // get max for the whole year
  const allMins = Object.entries(dailyMap)
    .filter(([ds]) => ds.startsWith(`${viewYear}-`))
    .map(([, m]) => m);
  const maxMins = allMins.length ? Math.max(...allMins) : 0;

  // pad empty days before Jan 1 so it starts on correct weekday column
  const startDow = yearStart.getDay(); // 0=Sun
  for (let i = 0; i < startDow; i++) {
    const filler = document.createElement("div");
    filler.className = "hm-cell filler";
    grid.appendChild(filler);
  }

  // fill every day of the year
  const cursor = new Date(yearStart);
  while (cursor <= yearEnd) {
    const ds = cursor.toISOString().split("T")[0];
    const mins = dailyMap[ds] || 0;
    const level = getLevel(mins, maxMins);

    const cell = document.createElement("div");
    cell.className = `hm-cell l${level}`;
    if (ds === todayStr) cell.classList.add("today");
    cell.setAttribute("data-tip", mins ? `${ds}: ${mins}m` : ds);
    grid.appendChild(cell);

    cursor.setDate(cursor.getDate() + 1);
  }
}

// ── WEEKLY BAR CHART ──────────────────────────────────
const weeklyBars = document.getElementById("weekly-bars");
const last7 = [...Array(7)].map((_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() - (6 - i));
  return d;
});
const dayTotals = last7.map(d => dailyMap[d.toISOString().split("T")[0]] || 0);
const maxDay = Math.max(...dayTotals);

if (maxDay === 0) {
  weeklyBars.innerHTML = "<p class='empty-msg'>No focus in last 7 days 🌿</p>";
} else {
  last7.forEach((d, i) => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const bar = document.createElement("div");
    bar.className = "bar" + (d.toISOString().split("T")[0] === todayStr ? " today-bar" : "");
    bar.style.height = Math.max((dayTotals[i] / maxDay * 100), 4) + "%";
    bar.style.minHeight = dayTotals[i] > 0 ? "8px" : "3px";

    const lbl = document.createElement("div");
    lbl.className = "bar-lbl";
    lbl.textContent = d.toLocaleDateString(undefined, { weekday: "short" });

    wrap.appendChild(bar);
    wrap.appendChild(lbl);
    weeklyBars.appendChild(wrap);
  });
}

// ── INSIGHTS ──────────────────────────────────────────
const dayMap = {};
successfulSessions.forEach(s => {
  const day = new Date(s.date).getDay();
  dayMap[day] = (dayMap[day] || 0) + s.duration;
});
const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let bestDay = null, bestDayVal = 0;
for (const d in dayMap) {
  if (dayMap[d] > bestDayVal) { bestDayVal = dayMap[d]; bestDay = d; }
}
document.getElementById("top-day").textContent =
  bestDay !== null ? `Most focused day: ${dayNames[bestDay]}` : "Most focused day: —";

const hourMap = {};
successfulSessions.forEach(s => {
  const hour = Number(s.startTime.split(":")[0]);
  hourMap[hour] = (hourMap[hour] || 0) + s.duration;
});
let bestHour = null, bestHourVal = 0;
for (const h in hourMap) {
  if (hourMap[h] > bestHourVal) { bestHourVal = hourMap[h]; bestHour = h; }
}
document.getElementById("top-hour").textContent =
  bestHour !== null ? `Most focused hour: ${bestHour}:00` : "Most focused hour: —";

// ── STREAKS ───────────────────────────────────────────
const uniqueDays = [...new Set(successfulSessions.map(s => s.date))].sort();
const dayDates = uniqueDays.map(d => { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; });

function daysBetween(a, b) {
  return Math.floor((b - a) / 86400000);
}

let currentStreak = 0, streakDate = new Date(today);
for (let i = dayDates.length - 1; i >= 0; i--) {
  const diff = daysBetween(dayDates[i], streakDate);
  if (diff === 0 || diff === 1) { currentStreak++; streakDate = new Date(dayDates[i]); }
  else break;
}

let bestStreak = 0, tempStreak = 1;
for (let i = 1; i < dayDates.length; i++) {
  if (daysBetween(dayDates[i-1], dayDates[i]) === 1) tempStreak++;
  else { bestStreak = Math.max(bestStreak, tempStreak); tempStreak = 1; }
}
bestStreak = Math.max(bestStreak, tempStreak);

document.getElementById("current-streak").textContent = currentStreak > 0 ? `${currentStreak} days` : "—";
document.getElementById("best-streak").textContent    = bestStreak > 0    ? `${bestStreak} days`    : "—";

// ── INIT ──────────────────────────────────────────────
renderHeatmap();
document.body.classList.add("history-loaded");