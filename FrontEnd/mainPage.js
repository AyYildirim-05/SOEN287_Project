function toggleProfileMenu() {
    const userDataString = localStorage.getItem("user");
    
    // Determine the base path based on whether we are in a subdirectory (like /courses/)
    const isInSubdir = window.location.pathname.includes('/courses/') || window.location.pathname.includes('/schedule/') || window.location.pathname.includes('/Auths/') || window.location.pathname.includes('/settings/');
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
                console.log(`Student ID: ${userData.studentID}`);
                window.location.href = `${basePath}settings/student_settings.html`; // path format for the settings page
                break;

            case "teacher":
                console.log(`Teacher ID: ${userData.teacherID}`);
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
        localStorage.removeItem("user"); // Clear corrupted data
    }
}

// Force reload when navigating back/forward to ensure data is fresh
window.addEventListener("pageshow", (event) => {
    // 1. Check if the page was restored from the BFCache (Back-Forward Cache)
    if (event.persisted) {
        window.location.reload();
        return;
    }

    // 2. Check the Navigation Timing API for back_forward type
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) {
        const navType = navEntries[0].type;
        if (navType === "back_forward") {
            window.location.reload();
        }
    }
});

// Force reload on Dashboard link click
document.addEventListener("DOMContentLoaded", () => {
    const backLinks = document.querySelectorAll(".backLink");
    backLinks.forEach(link => {
        link.addEventListener("click", function() {
            window.location.href = "../index.html";
        });
    });
});