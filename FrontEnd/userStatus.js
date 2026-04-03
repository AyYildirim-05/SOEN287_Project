document.addEventListener("DOMContentLoaded", () => {
    const accountSection = document.querySelector(".account");
    const loginLink = document.querySelector(".login");
    const signupLink = document.querySelector(".signup");
    const profileIcon = document.querySelector(".profile");

    const userDataString = localStorage.getItem("user");

    if (userDataString) {
        const user = JSON.parse(userDataString);

        if (loginLink) loginLink.style.display = "none";
        if (signupLink) signupLink.style.display = "none";

        const userNameSpan = document.createElement("span");
        userNameSpan.textContent = `Welcome, ${user.fname} ${user.lname}!`;
        userNameSpan.className = "user-name";

        const roleBadge = document.createElement("span");
        roleBadge.textContent = user.role.toUpperCase();
        roleBadge.className = "role-badge";
        roleBadge.style.backgroundColor = user.role === "teacher" ? "#0077cc" : "#28a745";
        roleBadge.style.color = "white";
        roleBadge.style.padding = "2px 8px";
        roleBadge.style.borderRadius = "12px";
        roleBadge.style.fontSize = "0.75rem";
        roleBadge.style.marginLeft = "8px";
        roleBadge.style.fontWeight = "800";

        const logoutBtn = document.createElement("button");
        logoutBtn.textContent = "Log Out";
        logoutBtn.className = "logout-btn";

        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("role"); // Clear the role
            alert("Logged out successfully!");
            window.location.reload();
        });

        userNameSpan.appendChild(roleBadge); // Add badge next to name
        if (accountSection && profileIcon) {
            accountSection.insertBefore(userNameSpan, profileIcon);
            accountSection.insertBefore(logoutBtn, profileIcon);
        }

        // Ensure role UI is applied for current user
        window.dispatchEvent(new Event("rolechange"));
    }
});

// Interconnect across tabs: if the user logs in/out in another tab, reload this one.
window.addEventListener("storage", (event) => {
    if (event.key === "user" || event.key === "token" || event.key === "role") {
        window.location.reload();
    }
});
