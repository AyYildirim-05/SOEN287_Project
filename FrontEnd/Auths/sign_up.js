document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.querySelector('form[action="signup"]');

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = {
                fname: document.getElementById("name").value,
                lname: document.getElementById("lastName").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
                role: document.querySelector('input[name="role"]:checked').value,
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
                    window.location.href = "sign_in.html";
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("Failed to connect to the server.");
            }
        });
    }
});
