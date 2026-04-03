document.addEventListener("DOMContentLoaded", async () => {
    const signupForm = document.querySelector('form[action="signup"]');
    const majorSelect = document.getElementById("major");

    // Fetch and populate majors
    try {
        const response = await fetch("/api/major");
        if (response.ok) {
            const majors = await response.json();
            majors.forEach(major => {
                const option = document.createElement("option");
                option.value = major.name || major.majorName; // Handles both name and majorName from backend
                option.textContent = major.name || major.majorName;
                majorSelect.appendChild(option);
            });
        } else {
            console.error("Failed to fetch majors:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching majors:", error);
    }

    // Role change listener to handle major visibility
    const roleInputs = document.querySelectorAll('input[name="role"]');
    const majorGroup = majorSelect.closest(".form-group");

    roleInputs.forEach(input => {
        input.addEventListener("change", (e) => {
            if (e.target.value === "admin") {
                majorGroup.style.display = "none";
                majorSelect.removeAttribute("required");
            } else {
                majorGroup.style.display = "block";
                majorSelect.setAttribute("required", "required");
            }
        });

        // Trigger once for initial state
        if (input.checked) {
            input.dispatchEvent(new Event("change"));
        }
    });

    function generateID() {
        return Math.floor(1000000 + Math.random() * 9000000).toString();
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const role = document.querySelector('input[name="role"]:checked').value;
            const generatedID = generateID();

            const formData = {
                fname: document.getElementById("name").value,
                lname: document.getElementById("lastName").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
                role: role,
                major: majorSelect.value
            };

            if (role === "student") {
                formData.studentID = generatedID;
            } else if (role === "teacher") {
                formData.teacherID = generatedID;
            }

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
