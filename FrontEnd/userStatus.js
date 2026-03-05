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

        const logoutBtn = document.createElement("button");
        logoutBtn.textContent = "Log Out";
        logoutBtn.className = "logout-btn";

        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            alert("Logged out successfully!");
            window.location.reload();
        });

        accountSection.insertBefore(userNameSpan, profileIcon);
        accountSection.insertBefore(logoutBtn, profileIcon);
    }
});
