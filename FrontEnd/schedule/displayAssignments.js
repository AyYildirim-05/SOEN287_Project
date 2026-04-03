// This is for grabbing assignments from backend and then displaying them.
async function loadDashboardAssignments() {
    const container = document.querySelector(".assignmentsSection");
    if (!container) return;

    container.innerHTML = "<p>Loading assignments...</p>";

    try {
        const userString = localStorage.getItem("user");
        let studentId = null;

        if (userString) {
            const userObj = JSON.parse(userString);
            studentId = userObj.uid;
        }

        if (!studentId) {
            console.error("No user is logged in.");
        return; 
}

        const res = await fetch("/api/assignments/all");
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const assignments =  await res.json();

        let completedAssignments = [];
        if (studentId) {
            const studentRes = await fetch(`/api/student/${studentId}`);
            if (studentRes.ok) {
                const studentData = await studentRes.json();
                completedAssignments = studentData.completedAssignments || [];
            } else {
                console.warn(`Failed to fetch student data: ${studentRes.status}`);
            }
        }

        container.innerHTML = "";

        if (assignments.length === 0) {
            container.innerHTML = "<p>No upcoming assignments.</p>";
            return;
        }

        assignments.forEach(a => {
            const dueDateString = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No due date";
            const weightDisplay = a.weight ? `Weight: ${a.weight}` : "Weight: N/A";
            const isChecked = completedAssignments.includes(a.id) ? "checked" : "";

            const box = document.createElement("div");
            box.className = "assignmentBox";

            box.innerHTML = `
                <div class="assignmentText">
                    <h4>Due: ${dueDateString}</h4>
                    <p class="weightText">${weightDisplay}</p> 
                    <h5>${a.title}</h5>
                    <p>Course ID: ${a.courseId}</p>
                </div>
                <label>
                    Completed <input type="checkbox" class="dashboard-checkbox" data-id="${a.id}" ${isChecked}>
                </label>            
            `;
            container.appendChild(box);
        });

        document.querySelectorAll(".dashboard-checkbox").forEach(checkbox => {
            checkbox.addEventListener("change", async (e) => {
                const assignmentId = e.target.getAttribute("data-id");
                const isChecked = e.target.checked;

                try {
                    await fetch("/api/assignments/toggle-completion", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            studentId: studentId,
                            assignmentId: assignmentId,
                            isCompleted: isChecked
                        })
                    });
                } catch (err) {
                    console.error("Could not update status", err);
                    e.target.checked = !isChecked; // Revert checkmark if it fails
                }
            })
        })
    } catch (error) {
        console.error("Error loading dashboard assingments: ", error);
        container.innerHTML = "<p>Error loading assignments.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadDashboardAssignments)


