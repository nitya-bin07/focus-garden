import { FocusTimer } from "./timer.js";

// --------------------
// DOM ELEMENTS
// --------------------
const presetButtons = document.querySelectorAll(".preset-buttons button");
const chooseTreeBtn = document.getElementById("choose-tree-btn");
const currentTreeName = document.getElementById("current-tree-name");

const timerDisplay = document.querySelector(".timer-display");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const minutesInput = document.getElementById("minutes-input");

const warningMessage = document.querySelector(".warning-message");

const plantEl = document.getElementById("plant");
const plantStatus = document.querySelector(".plant-status");
const progressRing = document.querySelector(".progress-ring-fill");
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;


progressRing.style.strokeDasharray = `${CIRCUMFERENCE}`;
progressRing.style.strokeDashoffset = `${CIRCUMFERENCE}`;

const categorySelect = document.getElementById("category-select");
const addCategoryBtn = document.getElementById("add-category-btn");

const deleteCategoryBtn = document.getElementById("delete-category-btn");

const focusModeInputs = document.querySelectorAll(
  'input[name="focus-mode"]'
);

function getFocusMode() {
  const selected = document.querySelector(
    'input[name="focus-mode"]:checked'
  );
  return selected ? selected.value : "offscreen";
}


function renderCategories() {
  const categories = getCategories();

  categorySelect.innerHTML =
    `<option value="">Select category</option>`;

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

renderCategories();

// --------------------
// APP STATE
// --------------------
let sessionState = "IDLE"; // IDLE | FOCUSING | SUCCESS | FAILED
let focusTimer = null;

let violationCount = 0;
const MAX_VIOLATIONS = 2;
let totalSessionSeconds = 0;


// 🔥 CORE DATA (source of truth)
let totalFocusedMinutes = 0;

// --------------------
// UTILS
// --------------------
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}



function getCategories() {
  return JSON.parse(localStorage.getItem("focusCategories")) || [
    "Study",
    "Coding",
    "Reading",
    "Workout",
    "Meditation",
    "Work",
    "Creative"
  ];
}

function saveCategories(categories) {
  localStorage.setItem("focusCategories", JSON.stringify(categories));
}


function getSelectedTree() {
  return localStorage.getItem("selectedTree") || "oak";
}
const TREE_EMOJIS = {
  oak: "🌳",
  pine: "🌲",
  cherry: "🌸"
};


function savePreferredMinutes(minutes) {
  localStorage.setItem("preferredMinutes", minutes);
}

function loadPreferredMinutes() {
  const saved = localStorage.getItem("preferredMinutes");
  return saved ? Number(saved) : 15;
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function updateDisplay(seconds) {
  timerDisplay.textContent = formatTime(seconds);
  updateProgressRing(seconds);
}


// 30 minutes = 1 tree
function calculateTrees(minutes) {
  return minutes / 30;
}

// --------------------
// PRESET ACTIVE UI HELPER ✅ (THIS WAS MISSING)
// --------------------
function setActivePreset(minutes) {
  presetButtons.forEach(btn => {
    btn.classList.toggle(
      "active",
      Number(btn.dataset.min) === minutes
    );
  });
}
const DEFAULT_CATEGORIES = [
  "Study",
  "Coding",
  "Reading",
  "Workout",
  "Meditation",
  "Work",
  "Creative"
];


// --------------------
// PLANT UI
// ------------------
// 

function showCompletedTree(treeType) {
 const TREE_EMOJIS = {
  oak: "🌳",
  pine: "🌲",
  cherry: "🌸",
  palm: "🌴",
  cactus: "🌵",
  maple: "🍁",
  bamboo: "🎋",
  bonsai: "🪴"
};


  plantEl.className = "plant tree";
  plantEl.textContent = TREE_EMOJIS[treeType] || "🌳";
  plantStatus.textContent = "Tree grown 🌱";
}
const treeType = getSelectedTree();
const treeEmoji = TREE_EMOJIS[treeType] || "🌳";

function getStoredSessions() {
  return JSON.parse(localStorage.getItem("focusSessions")) || [];
}

function saveSession(session) {
  const sessions = getStoredSessions();
  sessions.push(session);
  localStorage.setItem("focusSessions", JSON.stringify(sessions));
}

function updatePlantUI() {
  if (!plantEl) return;

  plantEl.className = "plant";
  plantEl.classList.remove("growing");
  void plantEl.offsetWidth; // force reflow
  plantEl.classList.add("growing");

  const trees = calculateTrees(totalFocusedMinutes);

  if (trees < 0.5) {
    plantEl.textContent = "🌰";
    plantEl.classList.add("seed");
    plantStatus.textContent = "Seed planted";
  } 
  else if (trees < 1) {
    plantEl.textContent = "🌱";
    plantEl.classList.add("sprout");
    plantStatus.textContent = "Half-grown tree";
  } 
  else if (trees < 2) {
    plantEl.textContent = "🌳";
    plantEl.classList.add("tree");
    plantStatus.textContent = "One full tree grown";
  } 
  else {
    plantEl.textContent = `🌳 x ${Math.floor(trees)}`;
    plantEl.classList.add("tree");
    plantStatus.textContent = `${Math.floor(trees)} trees grown`;
  }
}

function updateProgressRing(remainingSeconds) {
  if (!totalSessionSeconds) return;

  const progress =
    (totalSessionSeconds - remainingSeconds) / totalSessionSeconds;

  const offset = CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = offset;
}

// --------------------
// SESSION CONTROL
// --------------------


function startSession() {
  if (sessionState === "FOCUSING") return;

  const minutes = Number(minutesInput.value);

  // STRICT validation: only multiples of 15
  if (
    !minutes ||
    minutes < 15 ||
    minutes > 240 ||
    minutes % 15 !== 0
  ) {
    warningMessage.textContent =
      "⛔ Time must be 15, 30, 45 … up to 240 minutes.";
    return;
  }

  sessionState = "FOCUSING";
  violationCount = 0;
  warningMessage.textContent = "";

  if (plantEl) {
    plantEl.classList.remove("failed");
  }

  totalSessionSeconds = minutes * 60;
progressRing.style.strokeDashoffset = CIRCUMFERENCE;

focusTimer = new FocusTimer(
  minutes,
  updateDisplay,
  completeSession
);

focusTimer.start();


  startBtn.disabled = true;
  resetBtn.disabled = false;

  minutesInput.disabled = true;
  presetButtons.forEach(btn => btn.disabled = true);

  categorySelect.disabled = true;
addCategoryBtn.disabled = true;

deleteCategoryBtn.disabled = true;
focusModeInputs.forEach(r => r.disabled = true);


}

function completeSession() {
   sessionState = "SUCCESS";

  const sessionMinutes = Number(minutesInput.value);
  const treeType = getSelectedTree();

  const session = {
    date: new Date().toISOString().split("T")[0],
    startTime: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    duration: sessionMinutes,
    success: true,
    treeType: treeType,
    category: categorySelect.value || "Uncategorized",
    focusMode: getFocusMode()


    
  };

  saveSession(session);

  addCoins(sessionMinutes / 15);

  // 🔥 THIS WAS MISSING
  showCompletedTree(treeType);

  startBtn.disabled = false;
  resetBtn.disabled = true;


  minutesInput.disabled = false;
  presetButtons.forEach(btn => btn.disabled = false);

  categorySelect.disabled = false;
addCategoryBtn.disabled = false;

deleteCategoryBtn.disabled = false;
focusModeInputs.forEach(r => r.disabled = false);



}

function failSession() {
  sessionState = "FAILED";

  if (plantEl) {
    plantEl.classList.add("failed");
  }

  plantStatus.textContent = "🥀 Focus broken. Plant damaged.";

  if (focusTimer) {
    focusTimer.reset();
    updateDisplay(focusTimer.totalSeconds);
  }

  startBtn.disabled = false;
  resetBtn.disabled = true;

  minutesInput.disabled = false;
  presetButtons.forEach(btn => btn.disabled = false);
  progressRing.style.strokeDashoffset = CIRCUMFERENCE;

  categorySelect.disabled = false;
addCategoryBtn.disabled = false;

deleteCategoryBtn.disabled = false;

focusModeInputs.forEach(r => r.disabled = false);

}

function resetSession() {
  if (focusTimer) {
    focusTimer.reset();
    updateDisplay(focusTimer.totalSeconds);
  }

  sessionState = "IDLE";
  violationCount = 0;
  warningMessage.textContent = "";

  plantEl.className = "plant seed";
  plantEl.textContent = "🌰";
  plantStatus.textContent = "Start focusing to grow your plant";

  startBtn.disabled = false;
  resetBtn.disabled = true;


  minutesInput.disabled = false;
  presetButtons.forEach(btn => btn.disabled = false);
  progressRing.style.strokeDashoffset = CIRCUMFERENCE;

  categorySelect.disabled = false;
addCategoryBtn.disabled = false;

deleteCategoryBtn.disabled = false;
focusModeInputs.forEach(r => r.disabled = false);


}
function updateSelectedTreeLabel() {
  if (!currentTreeName) return;

  const tree = getSelectedTree();
  const names = {
    oak: "Oak 🌳",
    pine: "Pine 🌲",
    cherry: "Cherry 🌸"
  };

  currentTreeName.textContent = names[tree] || "Oak 🌳";
}


function getCoins() {
  return Number(localStorage.getItem("coins")) || 0;
}

function addCoins(amount) {
  const coins = getCoins() + amount;
  localStorage.setItem("coins", coins);
  updateCoinUI();
}

function updateCoinUI() {
  const coinEls = document.querySelectorAll(".coin-count");
  coinEls.forEach(el => {
    el.textContent = getCoins();
  });
}


// --------------------
// EVENT LISTENERS
// --------------------
startBtn.addEventListener("click", startSession);
resetBtn.addEventListener("click", resetSession);

if (chooseTreeBtn) {
  chooseTreeBtn.addEventListener("click", () => {
    if (sessionState === "FOCUSING") return;
    window.location.href = "trees.html";
  });
}

presetButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (sessionState === "FOCUSING") return;

    const minutes = Number(btn.dataset.min);

    minutesInput.value = minutes;
    totalSessionSeconds = minutes * 60;

    setActivePreset(minutes);
    savePreferredMinutes(minutes);

    // reset ring + display immediately
    updateDisplay(totalSessionSeconds);
    progressRing.style.strokeDashoffset = CIRCUMFERENCE;
  });
});


minutesInput.addEventListener("change", () => {
  let value = Number(minutesInput.value);

  if (!value || value < 15) value = 15;
  if (value > 240) value = 240;

  value = Math.round(value / 15) * 15;

  minutesInput.value = value;
  totalSessionSeconds = value * 60;

  setActivePreset(value);
  savePreferredMinutes(value);

  updateDisplay(totalSessionSeconds);
  progressRing.style.strokeDashoffset = CIRCUMFERENCE;
});


document.addEventListener("visibilitychange", () => {
  if (sessionState !== "FOCUSING") return;

  const mode = getFocusMode();

  // 💻 On-screen focus → allow tab switching
  if (mode === "onscreen") return;

  // 🌿 Off-screen focus → enforce discipline
  if (document.hidden) {
    violationCount++;

    if (violationCount === 1) {
      showToast(
        "Stay focused 🌿 — tab switching is restricted",
        "warning"
      );
    } else {
      failSession();
      showToast(
        "Focus broken. Plant damaged 🥀",
        "error"
      );
    }
  }
});


addCategoryBtn.addEventListener("click", () => {
  const newCategory = prompt("Enter new category name:");

  if (!newCategory) return;

  const categories = getCategories();

  if (categories.includes(newCategory)) {
    showToast("Category already exists", "warning")
    return;
  }

  categories.push(newCategory);
  saveCategories(categories);
  renderCategories();

  categorySelect.value = newCategory;
});

deleteCategoryBtn.addEventListener("click", () => {
  const selected = categorySelect.value;

  if (!selected) {
    showToast("Select a category to delete ⚠️", "warning");
    return;
  }

  if (DEFAULT_CATEGORIES.includes(selected)) {
    showToast("Default categories cannot be deleted ❌", "error");
    return;
  }

  // Check if category is used in sessions
  const sessions =
    JSON.parse(localStorage.getItem("focusSessions")) || [];

  const isUsed = sessions.some(
    s => s.category === selected
  );

  if (isUsed) {
    showToast(
      "Category is used in focus history and cannot be deleted",
      "error"
    );
    return;
  }

  // Delete category
  const categories = getCategories().filter(
    c => c !== selected
  );

  saveCategories(categories);
  renderCategories();

  categorySelect.value = "";
  showToast("Category deleted 🗑", "success");
});


// --------------------
// INITIAL RENDER
// --------------------
const initialMinutes = loadPreferredMinutes();
totalSessionSeconds = initialMinutes * 60;

minutesInput.value = initialMinutes;
setActivePreset(initialMinutes);
updateDisplay(totalSessionSeconds);
updatePlantUI();
progressRing.style.strokeDashoffset = CIRCUMFERENCE;
updateCoinUI();
