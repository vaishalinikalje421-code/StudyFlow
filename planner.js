
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("studyForm");
    const subjectInput = document.getElementById("subject");
    const dateInput = document.getElementById("studyDate");
    const startInput = document.getElementById("startTime");
    const endInput = document.getElementById("endTime");
    const categoryInput = document.getElementById("category");
    const notesInput = document.getElementById("studyNotes");

    const filterDate = document.getElementById("filterDate");
    const showAllBtn = document.getElementById("showAllBtn");
    const sessionsContainer = document.getElementById("studySessions");
    const scheduleCaption = document.getElementById("scheduleCaption");
    const formMessage = document.getElementById("formMessage");

    const totalSessions = document.getElementById("totalSessions");
    const todaySessions = document.getElementById("todaySessions");
    const totalHours = document.getElementById("totalHours");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const themeText = document.getElementById("themeText");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const STORAGE_KEY = "studyFlowSessions";
    const THEME_KEY = "studyFlowTheme";

    let sessions = [];

    try {
        const savedSessions = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (Array.isArray(savedSessions)) {
            sessions = savedSessions.filter(session =>
                session &&
                typeof session.id === "string" &&
                typeof session.subject === "string" &&
                typeof session.date === "string" &&
                typeof session.startTime === "string" &&
                typeof session.endTime === "string"
            );
        }
    } catch (error) {
        console.error("Could not load saved study sessions:", error);
    }

    function getLocalDate() {
        const now = new Date();

        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    }

    const today = getLocalDate();

    dateInput.value = today;
    filterDate.value = today;

    function saveSessions() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
            return true;
        } catch (error) {
            console.error("Could not save study sessions:", error);
            showMessage(
                "Unable to save. Check your browser storage settings.",
                "error"
            );
            return false;
        }
    }

    function showMessage(message, type = "") {
        formMessage.textContent = message;
        formMessage.className = "form-message";

        if (type) {
            formMessage.classList.add(type);
        }
    }

    function formatDate(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);

        return new Date(year, month - 1, day).toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }

    function formatTime(timeString) {
        const [hours, minutes] = timeString.split(":").map(Number);
        const date = new Date();

        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function getDuration(session) {
        const [startHours, startMinutes] =
            session.startTime.split(":").map(Number);

        const [endHours, endMinutes] =
            session.endTime.split(":").map(Number);

        return (endHours * 60 + endMinutes) -
            (startHours * 60 + startMinutes);
    }

    function formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours === 0) {
            return `${remainingMinutes} min`;
        }

        if (remainingMinutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${remainingMinutes}m`;
    }

    function updateSummary() {
        totalSessions.textContent = sessions.length;

        todaySessions.textContent = sessions.filter(
            session => session.date === today
        ).length;

        const minutes = sessions.reduce(
            (total, session) => total + getDuration(session),
            0
        );

        totalHours.textContent = formatDuration(minutes);
    }

    function createEmptyState() {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const icon = document.createElement("div");
        icon.className = "empty-icon";
        icon.textContent = "▦";

        const title = document.createElement("h3");
        title.textContent = "No study sessions yet";

        const description = document.createElement("p");
        description.textContent =
            "Add a session using the form to start planning your study time.";

        emptyState.append(icon, title, description);
        return emptyState;
    }

    function renderSessions() {
        sessionsContainer.replaceChildren();

        const selectedDate = filterDate.value;

        const visibleSessions = sessions
            .filter(session =>
                !selectedDate || session.date === selectedDate
            )
            .sort((a, b) =>
                (a.date + a.startTime).localeCompare(
                    b.date + b.startTime
                )
            );

        if (selectedDate) {
            scheduleCaption.textContent =
                `Sessions for ${formatDate(selectedDate)}`;
        } else {
            scheduleCaption.textContent = "All scheduled study sessions";
        }

        if (visibleSessions.length === 0) {
            sessionsContainer.appendChild(createEmptyState());
            updateSummary();
            return;
        }

        visibleSessions.forEach(session => {
            const card = document.createElement("article");
            card.className = "session-card";

            const accent = document.createElement("div");
            accent.className = "session-accent";

            const info = document.createElement("div");
            info.className = "session-info";

            const title = document.createElement("h3");
            title.textContent = session.subject;

            const meta = document.createElement("p");
            meta.className = "session-meta";
            meta.textContent =
                `${formatDate(session.date)} · ` +
                `${formatTime(session.startTime)} – ` +
                `${formatTime(session.endTime)} · ` +
                `${formatDuration(getDuration(session))}`;

            const category = document.createElement("span");
            category.className = "category-tag";
            category.textContent = session.category || "Study";

            info.append(title, meta, category);

            if (session.notes) {
                const notes = document.createElement("p");
                notes.className = "session-notes";
                notes.textContent = session.notes;
                info.appendChild(notes);
            }

            const actions = document.createElement("div");
            actions.className = "session-actions";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Delete";
            deleteButton.setAttribute(
                "aria-label",
                `Delete ${session.subject} session`
            );

            deleteButton.addEventListener("click", () => {
                const previousSessions = sessions;

                sessions = sessions.filter(
                    item => item.id !== session.id
                );

                if (!saveSessions()) {
                    sessions = previousSessions;
                    return;
                }

                renderSessions();
                showMessage("Study session deleted.", "success");
            });

            actions.appendChild(deleteButton);
            card.append(accent, info, actions);
            sessionsContainer.appendChild(card);
        });

        updateSummary();
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        showMessage("");

        const subject = subjectInput.value.trim();
        const date = dateInput.value;
        const startTime = startInput.value;
        const endTime = endInput.value;
        const category = categoryInput.value;
        const notes = notesInput.value.trim();

        if (!subject || !date || !startTime || !endTime) {
            showMessage("Please complete all required fields.", "error");
            return;
        }

        if (endTime <= startTime) {
            showMessage(
                "End time must be later than start time.",
                "error"
            );
            endInput.focus();
            return;
        }

        const newSession = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            subject,
            date,
            startTime,
            endTime,
            category,
            notes
        };

        const hasOverlap = sessions.some(session =>
            session.date === date &&
            startTime < session.endTime &&
            endTime > session.startTime
        );

        if (hasOverlap) {
            showMessage(
                "This time overlaps with another session. Choose a different time.",
                "error"
            );
            return;
        }

        sessions.push(newSession);

        if (!saveSessions()) {
            sessions = sessions.filter(
                session => session.id !== newSession.id
            );
            return;
        }

        filterDate.value = date;
        renderSessions();

        form.reset();
        dateInput.value = date;
        showMessage("Study session added successfully!", "success");
    });

    filterDate.addEventListener("change", renderSessions);

    showAllBtn.addEventListener("click", () => {
        filterDate.value = "";
        renderSessions();
    });

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark", isDark);
        themeIcon.textContent = isDark ? "☀" : "☾";
        themeText.textContent = isDark ? "Light mode" : "Dark mode";
    }

    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.warn("Could not read saved theme.");
    }

    applyTheme(savedTheme);

    themeToggle.addEventListener("click", () => {
        const newTheme = document.body.classList.contains("dark")
            ? "light"
            : "dark";

        applyTheme(newTheme);

        try {
            localStorage.setItem(THEME_KEY, newTheme);
        } catch (error) {
            console.warn("Could not save theme preference.");
        }
    });

    function closeSidebar() {
        document.body.classList.remove("menu-open");
    }

    menuToggle.addEventListener("click", () => {
        document.body.classList.toggle("menu-open");
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    document.querySelectorAll(".sidebar-nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });

    renderSessions();
});
