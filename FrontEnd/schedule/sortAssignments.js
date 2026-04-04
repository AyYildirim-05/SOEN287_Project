// For the sort schedule feature
function sortAssignmentBoxes(sortBy) {
    const activeContainer = document.querySelector(".assignmentsSection");
    const archiveContainer = document.querySelector(".archiveSection");

    // applies sorting to both active and archive sections
    [activeContainer, archiveContainer].forEach(container => {
        if (!container) return;

        const boxes = Array.from(container.querySelectorAll(".assignmentBox"));
        if (boxes.length <= 1) return; // So to not sort if 0 or 1 item

        boxes.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = a.querySelector("h4").innerText.replace("Due: ", "").trim();
                const dateB = b.querySelector("h4").innerText.replace("Due: ", "").trim();

                if (dateA === "No due date") return 1;
                if (dateB === "No due date") return -1;

                return new Date(dateA) - new Date(dateB);
            } else if (sortBy === 'course') {
                const courseA = Array.from(a.querySelectorAll("p")).find(p => p.innerText.startsWith("Course:")).innerText;
                const courseB = Array.from(b.querySelectorAll("p")).find(p => p.innerText.startsWith("Course:")).innerText;
                return courseA.localeCompare(courseB);
            } else if (sortBy === 'weight') {
                const weightA = parseFloat(a.querySelector(".weightText").innerText.replace(/[^0-9.]/g, "")) || 0;
                const weightB = parseFloat(b.querySelector(".weightText").innerText.replace(/[^0-9.]/g, "")) || 0;
                
                return weightB - weightA;
            }
            return 0;
        });
        boxes.forEach(box => container.appendChild(box));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const sortRadios = document.querySelectorAll('input[type="radio"][name="sortType"]');
    if (sortRadios.length === 0) return;

    // Default to 'date' if none are explicitly checked in the HTML
    let isAnyChecked = Array.from(sortRadios).some(r => r.checked);
    if (!isAnyChecked) {
        const dateRadio = Array.from(sortRadios).find(r => r.value === 'date');
        if (dateRadio) dateRadio.checked = true;
    }

    // listen for users clicking different sort options
    sortRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.checked) {
                sortAssignmentBoxes(e.target.value);
            }
        });
    });
});