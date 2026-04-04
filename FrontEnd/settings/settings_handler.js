document.addEventListener("DOMContentLoaded", async () => {
    const userDataString = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userDataString || !token) {
        alert("Session expired. Please log in again.");
        window.location.href = "../Auths/sign_in.html";
        return;
    }

    const user = JSON.parse(userDataString);
    const role = user.role;
    const apiBase = role === "student" ? "/api/student" : "/api/teacher";
    const getEndpoint = role === "student" ? "/getstudent" : "/getteacher";
    const updateEndpoint = role === "student" ? "/updatestudent" : "/updateteacher";

    // 0. Fetch and populate majors
    async function populateMajors() {
        const majorSelect = document.getElementById("major");
        if (!majorSelect) return;

        try {
            const response = await fetch("/api/major");
            if (response.ok) {
                const majors = await response.json();
                majors.forEach(m => {
                    const option = document.createElement("option");
                    const majorName = m.name || m.majorName;
                    option.value = majorName;
                    option.textContent = majorName;
                    majorSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error fetching majors:", error);
        }
    }

    // 1. Fetch current profile data
    try {
        await populateMajors();
        const response = await fetch(`${apiBase}${getEndpoint}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayProfile(data, role);
        } else {
            console.error("Failed to fetch profile data");
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }

    // 2. Display profile data in the summary section
    function displayProfile(data, role) {
        document.getElementById("summary-name").textContent = `${data.fname} ${data.lname}`;
        document.getElementById("summary-id").textContent = role === "student" ? data.studentID : data.teacherID;
        document.getElementById("summary-major").textContent = data.major || "N/A";
        document.getElementById("summary-email").textContent = data.email;
    }

    // 3. Handle Form Submission
    const form = document.getElementById("settings-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const updatePayload = {};

            // Only add fields that have a value (not empty)
            formData.forEach((value, key) => {
                if (value && value.trim() !== "") {
                    updatePayload[key] = value.trim();
                }
            });

            if (Object.keys(updatePayload).length === 0) {
                alert("No changes detected.");
                return;
            }

            if (updatePayload.password && updatePayload.password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            try {
                const response = await fetch(`${apiBase}${updateEndpoint}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updatePayload)
                });

                if (response.ok) {
                    alert("Profile updated successfully!");
                    
                    // Update localStorage with new name/data if changed
                    const updatedUser = { ...user, ...updatePayload };
                    delete updatedUser.password; // Don't keep password in local storage
                    
                    // If name was updated, ensure the display format in other parts of the app matches
                    localStorage.setItem("user", JSON.stringify(updatedUser));

                    // Refresh page to show updated summary and header
                    window.location.reload();
                } else {
                    const error = await response.json();
                    alert("Error updating profile: " + (error.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error updating profile:", error);
                alert("Network error. Please try again later.");
            }
        });
    }
});
