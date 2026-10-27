
document.addEventListener("DOMContentLoaded", () => {
    const THEME_KEY = "studyFlowTheme";

    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function readNumber(keys) {
        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) continue;

                const value = Number(raw);
                if (Number.isFinite(value) && value >= 0) return value;

                const parsed = JSON.parse(raw);
                if (typeof parsed === "number" && parsed >= 0) {
                    return parsed;
                }
            } catch {
                // Try the next candidate key.
            }
        }

        return 0;
    }

    function getLocalDateString(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function dateDaysAgo(days) {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - days);
        return getLocalDateString(date);
    }

    function getTaskDate(task) {
        const possibleDate =
            task.completedAt ||
            task.completedDate ||
            task.updatedAt ||
            task.date ||
            task.createdAt;

        if (typeof possibleDate !== "string") return null;

        const match = possibleDate.match(/^\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : null;
    }

    function isCompleted(task) {
        return task.completed === true ||
            task.completed === "true" ||
            task.status === "completed" ||
            task.done === true;
    }

    const tasks = readArray("studyFlowTasks");
    const sessions = readArray("studyFlowSessions");
    const goals = readArray("studyFlowGoals");

    const completed = tasks.filter(isCompleted);
    const achievedGoals = goals.filter(goal => goal.completed === true);
    const activeGoals = goals.filter(goal => goal.completed !== true);

    // Candidate keys for common dashboard timer implementations.
    // These should be aligned with script.js to guarantee accurate totals.
    const focusMinutes = readNumber([
        "studyFlowFocusMinutes",
        "focusMinutes",
        "totalFocusMinutes"
    ]);

    document.getElementById("completedTasks").textContent = completed.length;
    document.getElementById("focusTime").textContent =
        `${focusMinutes} min`;
    document.getElementById("goalsAchieved").textContent = achievedGoals.length;

    document.getElementById("allTasks").textContent = tasks.length;
    document.getElementById("scheduledSessions").textContent = sessions.length;
    document.getElementById("activeGoals").textContent = activeGoals.length;

    const completionRate = tasks.length
        ? Math.round((completed.length / tasks.length) * 100)
        : 0;

    document.getElementById("completionRate").textContent =
        `${completionRate}%`;

    function renderWeeklyChart() {
        const chart = document.getElementById("weeklyChart");
        chart.replaceChildren();

        const days = [];

        for (let offset = 6; offset >= 0; offset--) {
            const date = dateDaysAgo(offset);
            const dateObject = new Date(`${date}T12:00:00`);

            // Task dates are used only when a recognized date is available.
            const count = completed.filter(task =>
                getTaskDate(task) === date
            ).length;

            days.push({
                date,
                label: dateObject.toLocaleDateString(undefined, {
                    weekday: "short"
                }),
                count
            });
        }

        const maxValue = Math.max(1, ...days.map(day => day.count));

        days.forEach(day => {
            const dayColumn = document.createElement("div");
            dayColumn.className = "chart-day";

            const barArea = document.createElement("div");
            barArea.className = "chart-bar-area";

            const bar = document.createElement("div");
            bar.className = "chart-bar";
            const height = day.count
                ? Math.max(8, (day.count / maxValue) * 145)
                : 3;

            bar.style.height = `${height}px`;
            bar.title = `${day.count} completed task(s) on ${day.date}`;
            bar.setAttribute("aria-hidden", "true");

            const value = document.createElement("span");
            value.className = "chart-value";
            value.textContent = day.count;

            const label = document.createElement("span");
            label.className = "chart-label";
            label.textContent = day.label;

            barArea.appendChild(bar);
            dayColumn.append(barArea, value, label);
            chart.appendChild(dayColumn);
        });

        const hasDates = completed.some(task => getTaskDate(task));

        document.getElementById("chartNote").textContent = hasDates
            ? "Based on completion dates available in your saved task data."
            : "Your completed-task totals are shown above. The weekly chart needs task completion dates to show daily activity accurately.";
    }

    function renderAchievements() {
        const container = document.getElementById("achievements");
        container.replaceChildren();

        const achievements = [
            {
                icon: "✓",
                title: "First task completed",
                description: completed.length > 0
                    ? "You've completed at least one task. Keep going!"
                    : "Complete your first task to unlock this milestone.",
                unlocked: completed.length > 0
            },
            {
                icon: "◷",
                title: "Focus starter",
                description: focusMinutes >= 25
                    ? "You've recorded at least 25 focus minutes."
                    : "Record 25 minutes of focus time to reach this milestone.",
                unlocked: focusMinutes >= 25
            },
            {
                icon: "◎",
                title: "Goal achiever",
                description: achievedGoals.length > 0
                    ? "You've achieved a personal goal. Well done!"
                    : "Mark your first goal as achieved to unlock this milestone.",
                unlocked: achievedGoals.length > 0
            }
        ];

        achievements.forEach(item => {
            const card = document.createElement("article");
            card.className = "achievement-card";

            const icon = document.createElement("div");
            icon.className = "achievement-icon";
            icon.textContent = item.icon;

            const title = document.createElement("h3");
            title.textContent = item.title;

            const description = document.createElement("p");
            description.textContent = item.description;

            if (!item.unlocked) {
                card.style.opacity = "0.75";
            }

            card.append(icon, title, description);
            container.appendChild(card);
        });
    }

    function applyTheme(theme) {
        const dark = theme === "dark";
        document.body.classList.toggle("dark", dark);

        document.getElementById("themeIcon").textContent =
            dark ? "☀" : "☾";

        document.getElementById("themeText").textContent =
            dark ? "Light mode" : "Dark mode";
    }

    let theme = "light";

    try {
        theme = localStorage.getItem(THEME_KEY) || "light";
    } catch {
        // Use light mode if storage is unavailable.
    }

    applyTheme(theme);

    document.getElementById("themeToggle").addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark")
            ? "light"
            : "dark";

        applyTheme(nextTheme);

        try {
            localStorage.setItem(THEME_KEY, nextTheme);
        } catch {
            // Theme still changes for the current page.
        }
    });

    function closeSidebar() {
        document.body.classList.remove("menu-open");
    }

    document.getElementById("menuToggle").addEventListener("click", () => {
        document.body.classList.toggle("menu-open");
    });

    document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);

    document.querySelectorAll(".sidebar-nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });

    renderWeeklyChart();
    renderAchievements();
});
