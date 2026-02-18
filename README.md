# 🌱 Focus Garden

**Focus Garden** is a Forest-inspired productivity web app designed to help users build deep focus habits through visual rewards, gentle restrictions, and meaningful insights.

Unlike simple timers, Focus Garden combines **behavioral psychology**, **visual progress**, and **analytics** to help users understand *how* and *when* they focus best.


🔗 **Live Demo:**  
https://nitya-bin07.github.io/focus-garden/

---

## ✨ Key Features

### ⏱️ Smart Focus Timer
- Custom focus durations (15–240 minutes, multiples of 15)
- Analog progress ring for intuitive time perception
- No pause during focus (commitment-driven design)

### 🌿 Focus Modes
- **Off-Screen Focus**  
  Best for reading, studying, meditation  
  → Tab switching is restricted
- **On-Screen Focus**  
  Best for coding, research, design  
  → Tab switching allowed

This avoids *fake productivity* and respects real workflows.

---

### 🌳 Trees & Rewards
- Start with **3 free trees**
- Earn 🪙 **coins** for successful focus sessions  
  (1 coin per 15 minutes)
- Use coins to **unlock new trees**
- Each successful session grows one tree in your forest

---

### 🗂️ Categories (User-Defined)
- Built-in categories (Study, Coding, Reading, etc.)
- Create custom categories
- Categories are locked during focus for clean analytics
- Safe deletion (cannot delete categories used in history)

---

### 🌍 Forest View
- Visual collection of all successfully grown trees
- Each tree represents one completed focus session
- Empty and growth states handled honestly

---

### 📊 History & Analytics
- Total focus time
- Total sessions & total trees grown
- **Daily streaks** (current & best)
- **Weekly focus chart**
- **Monthly heatmap** (GitHub-style)
- Insights:
  - Most focused day of the week
  - Most focused hour of the day
  - Top focus category

All analytics are computed client-side using `localStorage`.

---

### 🔔 Custom Notifications
- Replaced all browser `alert()` calls with clean, non-blocking toast notifications
- Consistent UI feedback across the app

---

## 🧠 Design Philosophy

Focus Garden is built around a few core principles:

- **Commitment over convenience**  
  Once a session starts, key choices are locked.
- **Honest analytics**  
  No fake data, no forced streaks.
- **Calm UI**  
  Minimal, dark, distraction-free design.
- **Fair focus rules**  
  Coding ≠ distraction → focus mode adapts to task type.

  ### 🎉 Session Completion
- Confetti animation on successful session
- Post-session note prompt ("What did you accomplish?")
- Notes saved with each session and visible in forest view

  ### 🪙 Tree Shop
- 8 tree species (3 free, 5 unlockable)
- Spend coins to unlock new trees
- Owned/Selected/Locked states clearly shown

---

## 🛠️ Tech Stack

- **HTML5**
- **CSS3** (custom design system, glassmorphism, animations)
- **Vanilla JavaScript**
- **LocalStorage** for persistence

No frameworks. No backend. No external libraries.

---

## 📁 Project Structure

focus-garden/
│
├── index.html # Focus page
├── trees.html # Tree selection & unlocks
├── forest.html # Forest view
├── history.html # Analytics & history
│
├── css/
│ └── style.css
│
├── js/
│ ├── app.js
│ ├── forest.js
│ └── history.js
│
└── README.md



---

## 🚀 Running the Project

Just open `index.html` in your browser.

No build steps required.

---

## 🔮 Future Improvements

- Calendar-based forest layout
- Export focus history
- Accessibility improvements

---

## 👤 Author

Built by **Nityanand Maurya**  
Inspired by the Forest app, but designed and implemented from scratch.

---


  

