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

// ── CONTRIBUTION GRAPH (GitHub-style, rolling 12 months) ──
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function renderHeatmap() {
  const grid = document.getElementById("heatmap-grid");
  const monthsRow = document.getElementById("heatmap-months");
  grid.innerHTML = "";
  monthsRow.innerHTML = "";

  // Show ~53 weeks ending today, grid starts on the Sunday on/before that.
  const WEEKS = 53;
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - (WEEKS * 7 - 1));
  const gridStart = new Date(rangeStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // back up to Sunday

  // scale color levels off the max day within the visible range
  const rangeMins = [];
  for (const [ds, mins] of Object.entries(dailyMap)) {
    const d = new Date(ds);
    if (d >= gridStart && d <= today) rangeMins.push(mins);
  }
  const maxMins = rangeMins.length ? Math.max(...rangeMins) : 0;

  let totalSessionsInRange = 0;
  successfulSessions.forEach(s => {
    const d = new Date(s.date);
    if (d >= gridStart && d <= today) totalSessionsInRange++;
  });
  document.getElementById("nav-label").textContent =
    `${totalSessionsInRange} session${totalSessionsInRange === 1 ? "" : "s"} in the last year`;

  let lastMonthLabeled = -1;
  const cursor = new Date(gridStart);
  let col = 0;

  while (cursor <= today) {
    // month label: place once, on the first column that lands in a new month
    if (cursor.getDay() === 0) {
      if (cursor.getMonth() !== lastMonthLabeled) {
        const lbl = document.createElement("span");
        lbl.textContent = MONTH_NAMES[cursor.getMonth()];
        lbl.style.gridColumn = String(col + 1);
        monthsRow.appendChild(lbl);
        lastMonthLabeled = cursor.getMonth();
      }
      col++;
    }

    const ds = cursor.toISOString().split("T")[0];
    const cell = document.createElement("div");

    if (cursor < rangeStart || cursor > today) {
      cell.className = "hm-cell filler";
    } else {
      const mins = dailyMap[ds] || 0;
      const level = getLevel(mins, maxMins);
      cell.className = `hm-cell l${level}`;
      if (ds === todayStr) cell.classList.add("today");
      cell.setAttribute("data-tip", mins ? `${ds}: ${mins}m` : ds);
    }

    grid.appendChild(cell);
    cursor.setDate(cursor.getDate() + 1);
  }

  // scroll to the most recent weeks by default
  const scroller = document.getElementById("heatmap-scroll");
  if (scroller) scroller.scrollLeft = scroller.scrollWidth;
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

// ── ACHIEVEMENTS ──────────────────────────────────────
function parseHourFromStartTime(str) {
  if (!str) return null;
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const ampm = match[3];
  if (ampm) {
    if (/PM/i.test(ampm) && hour !== 12) hour += 12;
    if (/AM/i.test(ampm) && hour === 12) hour = 0;
  }
  return hour;
}

function computeBadges() {
  const unlockedTrees = JSON.parse(localStorage.getItem("unlockedTrees")) || ["oak", "pine", "cherry"];
  const treesGrown = successfulSessions.length;
  const totalHours = totalMinutes / 60;
  const longestSession = successfulSessions.reduce((m, s) => Math.max(m, s.duration), 0);
  const cleanSessions = successfulSessions.filter(s => !(s.violations && s.violations.length)).length;
  const earlyBird = successfulSessions.some(s => {
    const h = parseHourFromStartTime(s.startTime);
    return h !== null && h < 8;
  });
  const nightOwl = successfulSessions.some(s => {
    const h = parseHourFromStartTime(s.startTime);
    return h !== null && h >= 22;
  });

  return [
    { icon: "🌱", name: "First Tree", desc: "Complete your first focus session.", unlocked: treesGrown >= 1 },
    { icon: "🌳", name: "Grove", desc: "Grow 10 trees.", unlocked: treesGrown >= 10 },
    { icon: "🌲", name: "Forest", desc: "Grow 50 trees.", unlocked: treesGrown >= 50 },
    { icon: "🔥", name: "3-Day Streak", desc: "Focus 3 days in a row.", unlocked: bestStreak >= 3 },
    { icon: "⚡", name: "Week Strong", desc: "Focus 7 days in a row.", unlocked: bestStreak >= 7 },
    { icon: "⏳", name: "Century", desc: "Log 100 hours of total focus.", unlocked: totalHours >= 100 },
    { icon: "🧘", name: "Deep Focus", desc: "Complete a single 120+ min session.", unlocked: longestSession >= 120 },
    { icon: "🛡️", name: "Disciplined", desc: "10 sessions with zero tab-switch violations.", unlocked: cleanSessions >= 10 },
    { icon: "🌅", name: "Early Bird", desc: "Complete a session started before 8am.", unlocked: earlyBird },
    { icon: "🌙", name: "Night Owl", desc: "Complete a session started after 10pm.", unlocked: nightOwl },
    { icon: "🪴", name: "Bonsai Master", desc: "Unlock the Bonsai tree in the shop.", unlocked: unlockedTrees.includes("bonsai") },
  ];
}

function renderBadges() {
  const grid = document.getElementById("badge-grid");
  if (!grid) return;

  grid.innerHTML = "";
  computeBadges().forEach(b => {
    const el = document.createElement("div");
    el.className = `badge ${b.unlocked ? "unlocked" : "locked"}`;
    el.setAttribute("data-tip", b.unlocked ? b.desc : `🔒 ${b.desc}`);
    el.innerHTML = `<span class="b-icon">${b.icon}</span><span class="b-name">${b.name}</span>`;
    grid.appendChild(el);
  });
}

// ── FOCUS DISCIPLINE / VIOLATION LOG ───────────────────
function renderDisciplineLog() {
  const summaryEl = document.getElementById("discipline-summary");
  const logEl = document.getElementById("violation-log");
  if (!summaryEl || !logEl) return;

  const events = [];
  sessions.forEach(s => {
    (s.violations || []).forEach(v => {
      events.push({
        time: v.time,
        causedFailure: v.causedFailure,
        category: s.category
      });
    });
  });
  events.sort((a, b) => new Date(b.time) - new Date(a.time));

  const failedSessions = sessions.filter(s => s.success === false).length;
  const cleanSessions = successfulSessions.filter(s => !(s.violations && s.violations.length)).length;

  summaryEl.innerHTML = `
    <div class="discipline-stat"><span class="dv">${events.length}</span><span class="dl">Tab Switches</span></div>
    <div class="discipline-stat"><span class="dv">${failedSessions}</span><span class="dl">Sessions Broken</span></div>
    <div class="discipline-stat"><span class="dv">${cleanSessions}</span><span class="dl">Clean Sessions</span></div>
  `;

  if (events.length === 0) {
    logEl.innerHTML = `<p class="empty-msg">No tab-switch violations logged 🌿</p>`;
    return;
  }

  logEl.innerHTML = "";
  events.slice(0, 20).forEach(e => {
    const row = document.createElement("div");
    row.className = `violation-row ${e.causedFailure ? "failed" : "warning"}`;
    const dt = new Date(e.time);
    const timeStr = dt.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    row.innerHTML = `
      <span class="v-icon">${e.causedFailure ? "🥀" : "⚠️"}</span>
      <span class="v-text">${e.causedFailure ? "Session broken" : "Warning survived"} · ${e.category || "Uncategorized"}</span>
      <span class="v-time">${timeStr}</span>
    `;
    logEl.appendChild(row);
  });
}

// ── INIT ──────────────────────────────────────────────
renderHeatmap();
renderBadges();
renderDisciplineLog();
document.body.classList.add("history-loaded");