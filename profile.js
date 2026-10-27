
document.addEventListener("DOMContentLoaded", () => {
    // Profile form elements
    const profileForm = document.getElementById("profileForm");
    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const course = document.getElementById("course");
    const institution = document.getElementById("institution");
    const studyGoal = document.getElementById("studyGoal");
    const studyStyle = document.getElementById("studyStyle");

    const displayName = document.getElementById("displayName");
    const displayEmail = document.getElementById("displayEmail");
    const profileAvatar = document.getElementById("profileAvatar");

    const editProfileBtn = document.getElementById("editProfileBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const saveMessage = document.getElementById("saveMessage");
    const themeToggle = document.getElementById("themeToggle");

    // Storage key
    const PROFILE_KEY = "studyFlowProfile";

    // Load saved profile or use default values
    function loadProfile() {
        let profile = {};

        try {
            profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
        } catch (error) {
            console.error("Unable to load profile:", error);
        }

        fullName.value = profile.fullName || "";
        email.value = profile.email || "";
        course.value = profile.course || "";
        institution.value = profile.institution || "";
        studyGoal.value = profile.studyGoal || "3";
        studyStyle.value = profile.studyStyle || "Pomodoro";

        updateProfileOverview();
    }

    // Update the profile summary and avatar
    function updateProfileOverview() {
        const name = fullName.value.trim();
        const userEmail = email.value.trim();

        displayName.textContent = name || "Student Name";
        displayEmail.textContent = userEmail || "Add your email address";

        profileAvatar.textContent = name
            ? name.charAt(0).toUpperCase()
            : "S";
    }

    // Save profile information
    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const profile = {
            fullName: fullName.value.trim(),
            email: email.value.trim(),
            course: course.value.trim(),
            institution: institution.value.trim(),
            studyGoal: studyGoal.value,
            studyStyle: studyStyle.value
        };

        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

            updateProfileOverview();

            saveMessage.textContent = "✓ Profile saved successfully!";
            saveMessage.style.color = "#2e9b69";
        } catch (error) {
            console.error("Unable to save profile:", error);
            saveMessage.textContent = "Unable to save. Please try again.";
            saveMessage.style.color = "#dc3545";
        }
    });

    // Edit Profile button focuses the first field
    editProfileBtn.addEventListener("click", () => {
        fullName.focus();

        fullName.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    // Cancel changes and restore the last saved profile
    cancelBtn.addEventListener("click", () => {
        loadProfile();
        saveMessage.textContent = "";
    });

    // Update preview as the user types
    fullName.addEventListener("input", updateProfileOverview);
    email.addEventListener("input", updateProfileOverview);

    // Theme toggle
    function applyTheme(theme) {
        document.body.classList.toggle("dark-theme", theme === "dark");

        const icon = themeToggle.querySelector("i");
        const label = themeToggle.querySelector("span");

        if (icon) {
            icon.className = theme === "dark"
                ? "fa-solid fa-sun"
                : "fa-solid fa-moon";
        }

        if (label) {
            label.textContent = theme === "dark"
                ? "Light Mode"
                : "Toggle Theme";
        }
    }

    // Use the same theme preference as the other StudyFlow pages
    const savedTheme = localStorage.getItem("studyFlowTheme") || "light";
    applyTheme(savedTheme);

    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.contains("dark-theme");
        const newTheme = isDark ? "light" : "dark";

        localStorage.setItem("studyFlowTheme", newTheme);
        applyTheme(newTheme);
    });

    // Initialize the page
    loadProfile();
});
