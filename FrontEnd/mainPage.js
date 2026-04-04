function toggleProfileMenu() {
    const userDataString = localStorage.getItem("user");

    const isInSubdir =
        window.location.pathname.includes("/courses/") ||
        window.location.pathname.includes("/schedule/") ||
        window.location.pathname.includes("/Auths/") ||
        window.location.pathname.includes("/settings/");

    const basePath = isInSubdir ? "../" : "";

    if (!userDataString) {
        window.location.href = `${basePath}Auths/sign_in.html`;
        return;
    }

    try {
        const userData = JSON.parse(userDataString);
        const role = userData.role;

        console.log(`Welcome, ${userData.fname || 'User'}!`);

        switch (role) {
            case "student":
                window.location.href = `${basePath}settings/student_settings.html`;
                break;
            case "teacher":
                window.location.href = `${basePath}settings/teacher_settings.html`;
                break;

            case "admin":
                console.log(`Admin UID: ${userData.uid}`);
                window.location.href = `${basePath}settings/admin_settings.html`;
                break;
            default:
                console.warn("User role not recognized:", role);
                alert("Account error: Role not assigned.");
        }

    } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
    }
}

// Force reload when navigating back/forward to ensure data is fresh
window.addEventListener("pageshow", (event) => {
    // 1. Check if the page was restored from the BFCache (Back-Forward Cache)
    if (event.persisted) {
        window.location.reload();
        return;
    }

    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && navEntries[0].type === "back_forward") {
        window.location.reload();
    }
});

function setupBackLinks() {
    const backLinks = document.querySelectorAll(".backLink");

    backLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "../index.html";
        });
    });
}

function setupCourseSearch() {
    const searchBar = document.getElementById("searchBar");
    if (!searchBar) return;

    searchBar.addEventListener("input", () => {
        const searchValue = searchBar.value.trim().toLowerCase();
        const courseBoxes = document.querySelectorAll(".courseBox");

        courseBoxes.forEach((box) => {
            if (box.classList.contains("addCourseBox")) return;

            const text = box.textContent.toLowerCase();
            box.style.display = text.includes(searchValue) ? "" : "none";
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupBackLinks();
    setupCourseSearch();
});