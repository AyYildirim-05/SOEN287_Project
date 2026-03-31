document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector('form[action="signin"]');

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = {
                email: document.getElementById("username").value, 
                password: document.getElementById("password").value
            };

            try {
                const response = await fetch("/api/auth/signin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Save user data/token for other pages
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("role", data.user.role); // Store the role specifically for roleToggle.js
                    
                    alert("Login successful! Welcome, " + data.user.fname);
                    window.location.href = "../index.html"; // Redirect to home
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Failed to connect to the server.");
            }
        });
    }
});
