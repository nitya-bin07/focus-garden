const sessions =
  JSON.parse(localStorage.getItem("focusSessions")) || [];

const successfulSessions = sessions.filter(s => s.success);

// ================= SUMMARY =================
const totalMinutes = successfulSessions.reduce(
  (sum, s) => sum + s.duration,
  0
);

document.getElementById("total-focus-time").textContent =
  totalMinutes + " min";

document.getElementById("total-sessions").textContent =
  successfulSessions.length;

document.getElementById("total-trees").textContent =
  successfulSessions.length;

// Top category
const categoryMap = {};
successfulSessions.forEach(s => {
  categoryMap[s.category] =
    (categoryMap[s.category] || 0) + s.duration;
});

let topCategory = "—";
let maxCat = 0;

for (const cat in categoryMap) {
  if (categoryMap[cat] > maxCat) {
    maxCat = categoryMap[cat];
    topCategory = cat;
  }
}

document.getElementById("top-category").textContent = topCategory;

// ================= WEEKLY BARS =================
const weeklyBars = document.getElementById("weekly-bars");
weeklyBars.innerHTML = "";

const today = new Date();
today.setHours(0, 0, 0, 0);

const days = [...Array(7)].map((_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() - (6 - i));
  return d;
});

const dayTotals = days.map(d => {
  const dayStr = d.toISOString().split("T")[0];
  return successfulSessions
    .filter(s => s.date === dayStr)
    .reduce((sum, s) => sum + s.duration, 0);
});

if (dayTotals.every(v => v === 0)) {
  weeklyBars.innerHTML =
    "<p class='plant-status'>No focus in last 7 days 🌿</p>";
} else {
  const maxDay = Math.max(...dayTotals);

  days.forEach((d, i) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height =
      (dayTotals[i] / maxDay) * 100 + "%";

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent =
      d.toLocaleDateString(undefined, { weekday: "short" });

    const wrapper = document.createElement("div");
    wrapper.style.flex = "1";
    wrapper.appendChild(bar);
    wrapper.appendChild(label);

    weeklyBars.appendChild(wrapper);
  });
}

// ================= MONTHLY HEATMAP =================
const heatmapEl = document.getElementById("heatmap");
heatmapEl.innerHTML = "";

if (successfulSessions.length === 0) {
  heatmapEl.innerHTML =
    "<p class='plant-status'>Start focusing to build your month 🌱</p>";
} else {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dailyMinutes = {};

  successfulSessions.forEach(s => {
    const d = new Date(s.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;

    dailyMinutes[s.date] =
      (dailyMinutes[s.date] || 0) + s.duration;
  });

  const values = Object.values(dailyMinutes);
  const maxMinutes = values.length > 0 ? Math.max(...values) : 0;

  const todayStr = today.toISOString().split("T")[0];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const minutes = dailyMinutes[dateStr] || 0;

    let level = 0;
    if (maxMinutes > 0) {
      if (minutes > 0 && minutes <= maxMinutes * 0.33) level = 1;
      else if (minutes <= maxMinutes * 0.66) level = 2;
      else if (minutes > maxMinutes * 0.66) level = 3;
    }

    const cell = document.createElement("div");
    cell.className = `heatmap-day level-${level}`;
    cell.title = `${dateStr}: ${minutes} min`;

    if (dateStr === todayStr) {
      cell.style.outline = "2px solid #22c55e";
    }

    heatmapEl.appendChild(cell);
  }
}

// ================= INSIGHTS =================
const dayMap = {};
successfulSessions.forEach(s => {
  const day = new Date(s.date).getDay();
  dayMap[day] = (dayMap[day] || 0) + s.duration;
});

const dayNames = [
  "Sunday","Monday","Tuesday",
  "Wednesday","Thursday","Friday","Saturday"
];

let bestDay = null;
let bestDayVal = 0;

for (const d in dayMap) {
  if (dayMap[d] > bestDayVal) {
    bestDayVal = dayMap[d];
    bestDay = d;
  }
}

document.getElementById("top-day").textContent =
  bestDay !== null
    ? "Most focused day: " + dayNames[bestDay]
    : "Most focused day: —";

// Most focused hour
const hourMap = {};
successfulSessions.forEach(s => {
  const hour = Number(s.startTime.split(":")[0]);
  hourMap[hour] = (hourMap[hour] || 0) + s.duration;
});

let bestHour = null;
let bestHourVal = 0;

for (const h in hourMap) {
  if (hourMap[h] > bestHourVal) {
    bestHourVal = hourMap[h];
    bestHour = h;
  }
}

document.getElementById("top-hour").textContent =
  bestHour !== null
    ? "Most focused hour: " + bestHour + ":00"
    : "Most focused hour: —";

// ================= STREAKS =================
const uniqueDays = Array.from(
  new Set(successfulSessions.map(s => s.date))
).sort();

const dayDates = uniqueDays.map(d => new Date(d));

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

let currentStreak = 0;
let streakDate = today;

for (let i = dayDates.length - 1; i >= 0; i--) {
  const d = new Date(dayDates[i]);
  d.setHours(0, 0, 0, 0);

  if (
    daysBetween(d, streakDate) === 0 ||
    daysBetween(d, streakDate) === -1
  ) {
    currentStreak++;
    streakDate = d;
  } else {
    break;
  }
}

let bestStreak = 0;
let tempStreak = 1;

for (let i = 1; i < dayDates.length; i++) {
  if (daysBetween(dayDates[i - 1], dayDates[i]) === 1) {
    tempStreak++;
  } else {
    bestStreak = Math.max(bestStreak, tempStreak);
    tempStreak = 1;
  }
}

bestStreak = Math.max(bestStreak, tempStreak);

document.getElementById("current-streak").textContent =
  currentStreak > 0 ? `🔥 ${currentStreak} days` : "—";

document.getElementById("best-streak").textContent =
  bestStreak > 0 ? `🏆 ${bestStreak} days` : "—";

document.body.classList.add("history-loaded");
