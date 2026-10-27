
document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "studyFlowGoals";
    const THEME_KEY = "studyFlowTheme";

    const form = document.getElementById("goalForm");
    const titleInput = document.getElementById("goalTitle");
    const categoryInput = document.getElementById("goalCategory");
    const targetInput = document.getElementById("goalTarget");
    const unitInput = document.getElementById("goalUnit");
    const deadlineInput = document.getElementById("goalDeadline");
    const filterInput = document.getElementById("goalFilter");

    const goalsList = document.getElementById("goalsList");
    const goalMessage = document.getElementById("goalMessage");

    let goals = [];

    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(stored)) {
            goals = stored.filter(goal =>
                goal &&
                typeof goal.id === "string" &&
                typeof goal.title === "string" &&
                Number.isFinite(goal.target) &&
                goal.target > 0
            );
        }
    } catch (error) {
        console.error("Could not load goals:", error);
    }

    function saveGoals() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
            return true;
        } catch (error) {
            showMessage("Could not save goals. Check browser storage settings.", "error");
            return false;
        }
    }

    function showMessage(message, type = "") {
        goalMessage.textContent = message;
        goalMessage.className = "form-message";
        if (type) goalMessage.classList.add(type);
    }

    function todayString() {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    }

    function unitLabel(unit) {
        const labels = {
            minutes: "minutes",
            hours: "hours",
            sessions: "sessions",
            tasks: "tasks",
            days: "days",
            chapters: "chapters"
        };
        return labels[unit] || unit;
    }

    function getPercent(goal) {
        if (goal.completed) return 100;
        return Math.min(100, Math.round((goal.current / goal.target) * 100));
    }

    function updateSummary() {
        document.getElementById("totalGoals").textContent = goals.length;
        document.getElementById("activeGoals").textContent =
            goals.filter(goal => !goal.completed).length;
        document.getElementById("completedGoals").textContent =
            goals.filter(goal => goal.completed).length;
    }

    function makeButton(text, className, handler, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.className = className;
        if (label) button.setAttribute("aria-label", label);
        button.addEventListener("click", handler);
        return button;
    }

    function renderGoals() {
        goalsList.replaceChildren();

        const filter = filterInput.value;
        const visibleGoals = goals.filter(goal => {
            if (filter === "active") return !goal.completed;
            if (filter === "completed") return goal.completed;
            return true;
        });

        if (visibleGoals.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";

            const icon = document.createElement("div");
            icon.className = "empty-icon";
            icon.textContent = "◎";

            const heading = document.createElement("h3");
            heading.textContent = goals.length
                ? "No goals in this category"
                : "Your goals start here";

            const description = document.createElement("p");
            description.textContent = goals.length
                ? "Try a different filter to see your goals."
                : "Create your first goal and take a step toward your next achievement.";

            empty.append(icon, heading, description);
            goalsList.appendChild(empty);
            updateSummary();
            return;
        }

        visibleGoals.forEach(goal => {
            const card = document.createElement("article");
            card.className = "goal-card";

            const top = document.createElement("div");
            top.className = "goal-card-top";

            const titleArea = document.createElement("div");
            const title = document.createElement("h3");
            title.textContent = goal.title;

            const category = document.createElement("span");
            category.className = "goal-category";
            category.textContent = goal.category || "Study";

            titleArea.append(title, category);

            const status = document.createElement("span");
            const isOverdue = goal.deadline &&
                goal.deadline < todayString() &&
                !goal.completed;

            status.className = "goal-status " +
                (goal.completed ? "completed" : isOverdue ? "overdue" : "active");

            status.textContent = goal.completed
                ? "Achieved"
                : isOverdue ? "Overdue" : "In progress";

            top.append(titleArea, status);

            const description = document.createElement("p");
            description.className = "goal-description";

            let descriptionText =
                `${goal.current} / ${goal.target} ${unitLabel(goal.unit)}`;

            if (goal.deadline) {
                descriptionText += ` · Deadline: ${goal.deadline}`;
            }

            description.textContent = descriptionText;

            const progressRow = document.createElement("div");
            progressRow.className = "goal-progress-row";

            const progressLabel = document.createElement("span");
            progressLabel.textContent = "Goal progress";

            const percent = document.createElement("strong");
            percent.textContent = `${getPercent(goal)}%`;

            progressRow.append(progressLabel, percent);

            const track = document.createElement("div");
            track.className = "progress-track";
            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", `${goal.title} progress`);
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", "100");
            track.setAttribute("aria-valuenow", String(getPercent(goal)));

            const fill = document.createElement("div");
            fill.className = "progress-fill";
            fill.style.width = `${getPercent(goal)}%`;
            track.appendChild(fill);

            const actions = document.createElement("div");
            actions.className = "goal-actions";

            if (!goal.completed) {
                actions.appendChild(makeButton(
                    "+ Update progress",
                    "update-button",
                    () => updateProgress(goal.id),
                    `Update progress for ${goal.title}`
                ));

                actions.appendChild(makeButton(
                    "Mark achieved",
                    "complete-button",
                    () => completeGoal(goal.id),
                    `Mark ${goal.title} as achieved`
                ));
            }

            actions.appendChild(makeButton(
                "Delete",
                "delete-button",
                () => deleteGoal(goal.id),
                `Delete ${goal.title}`
            ));

            card.append(top, description, progressRow, track, actions);
            goalsList.appendChild(card);
        });

        updateSummary();
    }

    function updateProgress(id) {
        const goal = goals.find(item => item.id === id);
        if (!goal || goal.completed) return;

        const input = prompt(
            `Enter your new total progress in ${unitLabel(goal.unit)} (0–${goal.target}):`,
            String(goal.current)
        );

        if (input === null) return;

        const value = Number(input);

        if (input.trim() === "" || !Number.isFinite(value) ||
            value < 0 || value > goal.target) {
            showMessage(`Enter a number from 0 to ${goal.target}.`, "error");
            return;
        }

        const previous = goal.current;
        goal.current = value;

        if (goal.current >= goal.target) {
            goal.completed = true;
        }

        if (!saveGoals()) {
            goal.current = previous;
            goal.completed = false;
            return;
        }

        showMessage("Goal progress updated!", "success");
        renderGoals();
    }

    function completeGoal(id) {
        const goal = goals.find(item => item.id === id);
        if (!goal) return;

        const previousCurrent = goal.current;
        const previousCompleted = goal.completed;

        goal.current = goal.target;
        goal.completed = true;

        if (!saveGoals()) {
            goal.current = previousCurrent;
            goal.completed = previousCompleted;
            return;
        }

        showMessage("Congratulations on achieving your goal!", "success");
        renderGoals();
    }

    function deleteGoal(id) {
        const goal = goals.find(item => item.id === id);
        if (!goal) return;

        if (!confirm(`Delete the goal "${goal.title}"?`)) return;

        const previous = goals;
        goals = goals.filter(item => item.id !== id);

        if (!saveGoals()) {
            goals = previous;
            return;
        }

        showMessage("Goal deleted.", "success");
        renderGoals();
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        showMessage("");

        const title = titleInput.value.trim();
        const target = Number(targetInput.value);
        const unit = unitInput.value;
        const deadline = deadlineInput.value;

        if (!title) {
            showMessage("Please enter a goal title.", "error");
            return;
        }

        if (!Number.isSafeInteger(target) || target < 1 || target > 1000000) {
            showMessage("Enter a whole-number target between 1 and 1,000,000.", "error");
            return;
        }

        if (deadline && deadline < todayString()) {
            showMessage("Choose today or a future deadline.", "error");
            return;
        }

        const goal = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            title,
            category: categoryInput.value,
            target,
            unit,
            deadline,
            current: 0,
            completed: false,
            createdAt: todayString()
        };

        goals.push(goal);

        if (!saveGoals()) {
            goals = goals.filter(item => item.id !== goal.id);
            return;
        }

        form.reset();
        showMessage("Goal created successfully!", "success");
        renderGoals();
    });

    filterInput.addEventListener("change", renderGoals);

    function applyTheme(theme) {
        const dark = theme === "dark";
        document.body.classList.toggle("dark", dark);
        document.getElementById("themeIcon").textContent = dark ? "☀" : "☾";
        document.getElementById("themeText").textContent = dark
            ? "Light mode"
            : "Dark mode";
    }

    let theme = "light";
    try {
        theme = localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.warn("Could not read theme preference.");
    }

    applyTheme(theme);

    document.getElementById("themeToggle").addEventListener("click", () => {
        const next = document.body.classList.contains("dark")
            ? "light"
            : "dark";

        applyTheme(next);

        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (error) {
            console.warn("Could not save theme preference.");
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

    renderGoals();
});
