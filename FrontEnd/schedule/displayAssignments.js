// This is for grabbing assignments from backend and then displaying them.
async function loadDashboardAssignments() {
    const container = document.querySelector(".assignmentSection");
    if (!container) return;

    container.innerHTML = "<p>Loading assignments...</p>";

    try {
        const res = await fetch("http://localhost:3000/api/assignments/all");
        if (!res.ok) throw new Error("Failed to fetch assignments");

        const assignments =  await res.json();
        container.innerHTML = "";

        if (assignments.length === 0) {
            container.innerHTML = "<p>No upcoming assignments!</p>";
            return;
        }

        assignments.forEach(a => {
            const dueDateString = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No due date";

            const box = document.createElement("div");
            box.className = "assignmentBox";

            box.innerHTML = `
                <div class="assignmentText">
                    <h4>Due: ${dueDateString}</h4>
                    <h5>${a.title}</h5>
                    <p>Course ID: ${a.courseId}</p>
                </div>
                <label>
                    Completed <input type="checkbox" class="dashboard-checkbox" data-id="${a.id}">
                </label>            
            `;
            container.appendChild(box);
        });
    } catch (error) {
        console.error("Error loading dashboard assingments: ", error);
        container.innerHTML = "<p>Error loading assignments.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadDashboardAssignments)


