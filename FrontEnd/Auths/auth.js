document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.querySelector('form[action="signup"]');
    const loginForm = document.querySelector('form[action="login"]');

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = {
                fname: document.getElementById("name").value,
                lname: document.getElementById("lastName").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
                role: document.querySelector('input[name="role"]:checked').value,
                // These are optional in your backend, adding placeholders for now
                studentID: null,
                major: null
            };

            try {
                const response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Sign up successful! Please log in.");
                    window.location.href = "login.html";
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("Failed to connect to the server.");
            }
        });
    }

    // --- LOG IN LOGIC ---
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
                    
                    alert("Login successful!" + "User data:", data.user.fname);
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
