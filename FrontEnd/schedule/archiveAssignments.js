// For the archive feature, which displays the completed assignments.
document.addEventListener("DOMContentLoaded", () => {
    const archiveButton = document.getElementById("archiveScheduleButton");
    const archiveSection = document.querySelector(".archiveSection");
    const scheduleContainer = document.querySelector(".scheduleContainer");
    const assignmentsSection = document.querySelector(".assignmentsSection");

    // this if makes sure that the elements exist on the page before the event listener runs
    if (archiveButton && archiveSection) {
        archiveButton.addEventListener("click", () => {
            archiveSection.classList.toggle("hidden");

            if (archiveSection.classList.contains("hidden")) {
                archiveButton.textContent = "View Archive";
            } else {
                archiveButton.textContent = "Hide Archive";
            }
        });
    }

    // this puts assignments in the corresponding section depending on if they are checked as completed
    if (scheduleContainer) {
        scheduleContainer.addEventListener("change", (event) => {
            if (event.target.type === "checkbox") {
                // this is the closest parent div with the class "assignmentBox" for the event
                const assignmentBox = event.target.closest(".assignmentBox");

                if (assignmentBox) {
                    if (event.target.checked) {
                        // if assignmnet is checked as completed, move the box into the archive section
                        archiveSection.appendChild(assignmentBox);
                    } else {
                        // if unchecked, the assingment is moved into assingments section
                        assignmentsSection.appendChild(assignmentBox);
                    }
                }
            }
        })
    }
});