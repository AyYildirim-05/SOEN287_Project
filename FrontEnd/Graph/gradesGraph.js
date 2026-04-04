/*const courses = ["SOEN287", "SOEN228", "COMP249", "ENGR233", "ENGR202"]; // x-axis labels

const grades = [85, 90, 78, 92, 88]; // y-axis data

const gradesGraph = new Chart("gradesChart", {
    type: 'bar',
    data: {
        labels: courses,
        datasets: [{
            backgroundColor: 'lightgoldenrodyellow',
            data: grades
        }]
    },

    options: {
        plugins: {
            legend: {
                display: false
            }
        }
    }
})*/

/**
 * gradesGraph.js
 * Fetches the logged-in student's enrolled courses (with assignment
 * completion stats) from the backend and renders a Chart.js bar chart.
 *
 * Replaces the old hardcoded version.
 * Depends on: Chart.js (already imported in index.html)
 */

(async function initGradesGraph() {
    const canvas = document.getElementById("gradesChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Show a loading state on the canvas
    ctx.fillStyle = "#999";
    ctx.font = "14px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("Loading grades…", canvas.width / 2, canvas.height / 2);

    // ── 1. Auth check ────────────────────────────────────────────────
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#aaa";
        ctx.fillText("Log in to see your grades.", canvas.width / 2, canvas.height / 2);
        return;
    }

    const user = JSON.parse(userStr);

    // Only students have enrolled courses
    if (user.role !== "student") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#aaa";
        ctx.fillText("Grade graph is for students.", canvas.width / 2, canvas.height / 2);
        return;
    }

    // ── 2. Fetch data from backend ───────────────────────────────────
    let courses = [];
    try {
        const res = await fetch("/api/grades/my-courses", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        courses = await res.json();
    } catch (err) {
        console.error("gradesGraph: failed to fetch course data:", err);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e55";
        ctx.fillText("Could not load grades.", canvas.width / 2, canvas.height / 2);
        return;
    }

    // ── 3. Handle empty state ────────────────────────────────────────
    if (!courses.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#aaa";
        ctx.font = "14px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText("No enrolled courses yet.", canvas.width / 2, canvas.height / 2);
        return;
    }

    // ── 4. Build chart data ──────────────────────────────────────────
    const labels = courses.map(c => c.code);
    const data   = courses.map(c => c.completionPercent);

    // Color bars: green ≥ 80, yellow ≥ 50, red < 50
    const backgroundColors = data.map(v =>
        v >= 80 ? "rgba(74, 222, 128, 0.75)"  // green
      : v >= 50 ? "rgba(251, 191, 36, 0.75)"  // yellow
      :           "rgba(248, 113, 113, 0.75)"  // red
    );
    const borderColors = backgroundColors.map(c => c.replace("0.75", "1"));

    // ── 5. Destroy any existing chart instance before re-rendering ───
    if (window._gradesChartInstance) {
        window._gradesChartInstance.destroy();
    }

    // ── 6. Render Chart.js bar chart ─────────────────────────────────
    window._gradesChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Assignment Completion (%)",
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        // Richer tooltip showing completed / total
                        label: (ctx) => {
                            const course = courses[ctx.dataIndex];
                            return [
                                ` Completion: ${course.completionPercent}%`,
                                ` Done: ${course.completedCount} / ${course.totalAssignments} assignments`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: v => v + "%",
                        font: { family: "Trebuchet MS", size: 11 }
                    },
                    grid: { color: "rgba(0,0,0,0.06)" }
                },
                x: {
                    ticks: { font: { family: "Trebuchet MS", size: 12 } },
                    grid: { display: false }
                }
            }
        }
    });

    // ── 7. Refresh whenever the student toggles a completion checkbox ─
    //      (dispatched by archiveAssignments.js / displayAssignments.js)
    document.addEventListener("assignmentStatusChanged", async () => {
        // Re-fetch fresh data and update chart in-place
        try {
            const freshRes = await fetch("/api/grades/my-courses", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (!freshRes.ok) return;
            const freshCourses = await freshRes.json();

            window._gradesChartInstance.data.labels = freshCourses.map(c => c.code);
            window._gradesChartInstance.data.datasets[0].data =
                freshCourses.map(c => c.completionPercent);
            window._gradesChartInstance.update();

            // Refresh tooltip source array too
            courses.length = 0;
            freshCourses.forEach(c => courses.push(c));
        } catch (e) {
            console.warn("gradesGraph: could not refresh after status change", e);
        }
    });
})();