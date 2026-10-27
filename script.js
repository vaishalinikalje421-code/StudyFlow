
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const today = new Date();
const dateKey = today.toLocaleDateString("en-CA");

// ---------- DATE AND FOOTER ----------

$("#todayDate").textContent = today.toLocaleDateString("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric"
});

$("#footerYear").textContent = today.getFullYear();

// ---------- TASK DATA ----------

const starterTasks = [
  { id: 1, title: "Review Data Structures notes", priority: "High", done: true },
  { id: 2, title: "Complete mathematics assignment", priority: "Medium", done: true },
  { id: 3, title: "Practice JavaScript exercises", priority: "High", done: false },
  { id: 4, title: "Read one chapter of DBMS", priority: "Low", done: false },
  { id: 5, title: "Revise today's lecture", priority: "Medium", done: false }
];

function loadTasks() {
  try {
    const saved = localStorage.getItem("studyflow-tasks");
    return saved === null ? starterTasks : JSON.parse(saved);
  } catch {
    return starterTasks;
  }
}

let tasks = loadTasks();
let currentFilter = "all";
let nextId = Math.max(0, ...tasks.map(task => Number(task.id) || 0)) + 1;

function saveTasks() {
  try {
    localStorage.setItem("studyflow-tasks", JSON.stringify(tasks));
  } catch {
    // The app still works if browser storage is unavailable.
  }
}

// ---------- TASK LIST ----------

function renderTasks() {
  const taskList = $("#taskList");
  taskList.replaceChildren();

  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.done;
    if (currentFilter === "completed") return task.done;
    return true;
  });

  $("#emptyState").hidden = visibleTasks.length !== 0;

  visibleTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = `task-item${task.done ? " done" : ""}`;

    const check = document.createElement("button");
    check.className = `task-check${task.done ? " checked" : ""}`;
    check.textContent = task.done ? "✓" : "";
    check.setAttribute("aria-label", task.done ? "Mark incomplete" : "Mark complete");
    check.setAttribute("aria-pressed", String(task.done));
    check.addEventListener("click", () => toggleTask(task.id));

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = `${task.priority} priority`;

    const status = document.createElement("span");
    status.textContent = task.done ? "Completed" : "In progress";

    meta.append(priority, status);
    details.append(title, meta);

    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.title = "Delete task";
    remove.addEventListener("click", () => deleteTask(task.id));

    item.append(check, details, remove);
    taskList.append(item);
  });

  const completed = tasks.filter(task => task.done).length;
  const total = tasks.length;
  const pending = total - completed;
  const percentage = total ? Math.round(completed / total * 100) : 0;

  $("#totalTasks").textContent = total;
  $("#completedTasks").textContent = completed;
  $("#pendingTasks").textContent = pending;
  $("#completionRate").textContent = `${percentage}%`;
  $("#navTaskCount").textContent = pending;
  $("#taskListCount").textContent =
    `${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`;

  $("#sidebarProgress").style.width = `${percentage}%`;
  $("#sidebarProgressText").textContent = `${percentage}% of tasks completed`;

  $("#goalCompleted").textContent = completed;
  $("#goalFill").style.width = `${Math.min(100, completed / 5 * 100)}%`;
  $("#goalMessage").textContent = completed >= 5
    ? "Amazing! You reached your daily goal. ✨"
    : `Complete ${5 - completed} more task${5 - completed === 1 ? "" : "s"} to reach your daily goal.`;

  $("#taskFooter").textContent = pending === 0
    ? "Wonderful! All tasks are complete."
    : `${pending} task${pending === 1 ? "" : "s"} left. You've got this!`;

  $("#weeklySummary").textContent =
    `${completed} task${completed === 1 ? "" : "s"} completed today`;

  renderWeeklyChart();
}

function toggleTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  task.done = !task.done;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

// ---------- ADD TASK FORM ----------

$("#addTaskButton").addEventListener("click", () => {
  const form = $("#taskForm");
  form.hidden = !form.hidden;

  if (!form.hidden) {
    $("#taskInput").focus();
  }
});

$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("#taskInput");
  const title = input.value.trim();
  if (!title) return;

  tasks.unshift({
    id: nextId++,
    title,
    priority: $("#taskPriority").value,
    done: false
  });

  saveTasks();
  currentFilter = "all";

  $$(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  renderTasks();
  input.value = "";
  $("#taskForm").hidden = true;
});

$("#taskFilters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  currentFilter = button.dataset.filter;

  $$(".filter").forEach(filter => {
    filter.classList.toggle("active", filter === button);
  });

  renderTasks();
});

$("#viewAllTasks").addEventListener("click", () => {
  currentFilter = "all";

  $$(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  renderTasks();
});

// ---------- POMODORO TIMER ----------

const FULL_CIRCLE = 100;
let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;
let timerInterval = null;
let timerRunning = false;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  $("#timerDisplay").textContent = formatTime(remainingSeconds);

  const totalSeconds = selectedMinutes * 60;
  const progress = totalSeconds > 0
    ? (remainingSeconds / totalSeconds) * FULL_CIRCLE
    : 0;

  $("#timerRing").style.background =
    `conic-gradient(var(--primary) ${progress}%, var(--border) ${progress}%)`;

  document.title = timerRunning
    ? `${formatTime(remainingSeconds)} | StudyFlow`
    : "StudyFlow | Student Productivity";
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerRunning = false;
  $("#timerStart").textContent = "▶ Start focus";
}

function selectTimerMode(minutes) {
  stopTimer();
  selectedMinutes = minutes;
  remainingSeconds = minutes * 60;

  $$(".mode-button").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.minutes) === minutes
    );
  });

  $("#timerCaption").textContent = minutes === 25
    ? "TIME TO FOCUS"
    : "TIME TO REST";

  $("#timerSubtitle").textContent = minutes === 25
    ? "Pomodoro session"
    : "Take a short break";

  updateTimerDisplay();
}

$$(".mode-button").forEach(button => {
  button.addEventListener("click", () => {
    selectTimerMode(Number(button.dataset.minutes));
  });
});

$("#timerStart").addEventListener("click", () => {
  if (timerRunning) {
    stopTimer();
    updateTimerDisplay();
    return;
  }

  if (remainingSeconds <= 0) {
    remainingSeconds = selectedMinutes * 60;
  }

  timerRunning = true;
  $("#timerStart").textContent = "Ⅱ Pause timer";

  // Use a deadline to reduce drift if a browser tab is inactive.
  const deadline = Date.now() + remainingSeconds * 1000;

  timerInterval = setInterval(() => {
    remainingSeconds = Math.max(
      0,
      Math.ceil((deadline - Date.now()) / 1000)
    );

    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      stopTimer();

      if (selectedMinutes === 25) {
        const oldMinutes = Number(
          localStorage.getItem("studyflow-focus-minutes") || 0
        );

        try {
          localStorage.setItem(
            "studyflow-focus-minutes",
            String(oldMinutes + 25)
          );
        } catch {
          // Timer completion still works without storage.
        }

        updateFocusMinutes();
      }

      $("#timerCaption").textContent = "SESSION COMPLETE";
      $("#timerSubtitle").textContent = "Well done! Take a breath.";
      $("#timerStart").textContent = "↻ Start again";

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("StudyFlow", {
          body: "Your timer has finished. Great work!"
        });
      }

      if (selectedMinutes === 25) {
        alert("Focus session complete! Great work. 🎉");
      }
    }
  }, 250);

  updateTimerDisplay();
});

$("#timerReset").addEventListener("click", () => {
  stopTimer();
  remainingSeconds = selectedMinutes * 60;
  $("#timerCaption").textContent = selectedMinutes === 25
    ? "TIME TO FOCUS"
    : "TIME TO REST";
  $("#timerSubtitle").textContent = selectedMinutes === 25
    ? "Pomodoro session"
    : "Take a short break";
  updateTimerDisplay();
});

// ---------- FOCUS TIME ----------

function updateFocusMinutes() {
  let minutes = 0;

  try {
    minutes = Number(
      localStorage.getItem("studyflow-focus-minutes") || 0
    );
  } catch {
    minutes = 0;
  }

  $("#focusHours").innerHTML = `${minutes} <small>min</small>`;
}

// ---------- WEEKLY CHART ----------

function renderWeeklyChart() {
  const chart = $("#weeklyChart");
  chart.replaceChildren();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDay = today.getDay();

  // The chart shows today's completed-task count.
  // Other days start at zero until historical tracking is added.
  const values = Array(7).fill(0);
  values[currentDay] = tasks.filter(task => task.done).length;

  const maxValue = Math.max(5, ...values);

  // Display Monday through Sunday.
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  orderedDays.forEach(dayIndex => {
    const day = document.createElement("div");
    day.className = `chart-day${dayIndex === currentDay ? " today" : ""}`;

    const bar = document.createElement("div");
    bar.className = "chart-bar";

    const height = Math.max(4, values[dayIndex] / maxValue * 100);
    bar.style.height = `${height}%`;
    bar.title = `${dayNames[dayIndex]}: ${values[dayIndex]} completed`;

    const label = document.createElement("span");
    label.textContent = dayNames[dayIndex];

    day.append(bar, label);
    chart.append(day);
  });
}

// ---------- LIGHT / DARK THEME ----------

function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);

  $("#themeToggle").innerHTML = dark
    ? "<span>☀</span> Switch to Light"
    : "<span>◐</span> Switch Theme";

  $("#topThemeToggle").textContent = dark ? "☀" : "◐";
  $("#topThemeToggle").setAttribute(
    "aria-label",
    dark ? "Switch to light theme" : "Switch to dark theme"
  );

  try {
    localStorage.setItem("studyflow-dark-mode", String(dark));
  } catch {
    // Theme can still change for the current session.
  }
}

let isDark = false;

try {
  isDark = localStorage.getItem("studyflow-dark-mode") === "true";
} catch {
  // Use light theme by default.
}

applyTheme(isDark);

function toggleTheme() {
  isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
}

$("#themeToggle").addEventListener("click", toggleTheme);
$("#topThemeToggle").addEventListener("click", toggleTheme);

// ---------- MOBILE SIDEBAR ----------

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

$$(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    if (link.tagName === "A") {
      $$(".navigation a").forEach(item => {
        item.classList.toggle("active", item === link);
      });

      $("#sidebar").classList.remove("open");
    }
  });
});

document.addEventListener("click", event => {
  const sidebar = $("#sidebar");
  const menuButton = $("#menuToggle");

  if (
    window.innerWidth <= 760 &&
    sidebar.classList.contains("open") &&
    !sidebar.contains(event.target) &&
    !menuButton.contains(event.target)
  ) {
    sidebar.classList.remove("open");
  }
});

// ---------- INITIALIZE DASHBOARD ----------

renderTasks();
updateFocusMinutes();
updateTimerDisplay();
