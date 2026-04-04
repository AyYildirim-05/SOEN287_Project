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


(async function initGradesGraph() {
    const canvas = document.getElementById("gradesChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Show a loading state on the canvas
    ctx.fillStyle = "#999";
    ctx.font = "14px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("Loading grades…", canvas.width / 2, canvas.height / 2);

    // Authentication
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

    // Getting courses of the current user
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

    // If empty
    if (!courses.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#aaa";
        ctx.font = "14px Trebuchet MS";
        ctx.textAlign = "center";
        ctx.fillText("No enrolled courses yet.", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Building chart
    const labels = courses.map(c => c.code);

    // Use courseGrade if available, otherwise 0 for the bar height
    const data = courses.map(c => c.courseGrade ?? 0);

    // Color bars: grey = no grades yet, green >= 80, yellow >= 60, red < 60
    const backgroundColors = courses.map(c => {
        if (c.courseGrade === null)  return "rgba(200, 200, 200, 0.75)"; // grey = no grades yet
        if (c.courseGrade >= 80)    return "rgba(74, 222, 128, 0.75)";  // green
        if (c.courseGrade >= 60)    return "rgba(251, 191, 36, 0.75)";  // yellow
        return "rgba(248, 113, 113, 0.75)";                              // red
    });
    const borderColors = backgroundColors.map(c => c.replace("0.75", "1"));

    // Refreshing the chart
    if (window._gradesChartInstance) {
        window._gradesChartInstance.destroy();
    }

    // Loading the chart with Chart.js
    window._gradesChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Course Grade (%)",
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
                        // Tooltip when hovering over a bar
                        label: (ctx) => {
                            const course = courses[ctx.dataIndex];
                            if (course.courseGrade === null) {
                                return " No grades entered yet";
                            }
                            return [
                                ` Grade: ${course.courseGrade}%`,
                                ` Total assignments: ${course.totalAssignments}`
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

    // Refresh whenever the student enters a grade
    document.addEventListener("assignmentStatusChanged", async () => {
        try {
            const freshRes = await fetch("/api/grades/my-courses", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (!freshRes.ok) return;
            const freshCourses = await freshRes.json();

            window._gradesChartInstance.data.labels = freshCourses.map(c => c.code);
            window._gradesChartInstance.data.datasets[0].data =
                freshCourses.map(c => c.courseGrade ?? 0);
            window._gradesChartInstance.data.datasets[0].backgroundColor =
                freshCourses.map(c => {
                    if (c.courseGrade === null) return "rgba(200, 200, 200, 0.75)";
                    if (c.courseGrade >= 80)   return "rgba(74, 222, 128, 0.75)";
                    if (c.courseGrade >= 60)   return "rgba(251, 191, 36, 0.75)";
                    return "rgba(248, 113, 113, 0.75)";
                });
            window._gradesChartInstance.update();

            // Refresh tooltip source array too
            courses.length = 0;
            freshCourses.forEach(c => courses.push(c));
        } catch (e) {
            console.warn("gradesGraph: could not refresh after grade change", e);
        }
    });
})();