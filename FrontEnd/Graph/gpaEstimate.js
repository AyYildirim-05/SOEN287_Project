// GPA Estimate

function percentageToGPA(percent) {
    if (percent >= 90) return 4.0;
    if (percent >= 85) return 3.7;
    if (percent >= 80) return 3.3;
    if (percent >= 77) return 3.0;
    if (percent >= 73) return 2.7;
    if (percent >= 70) return 2.3;
    if (percent >= 67) return 2.0;
    if (percent >= 63) return 1.7;
    if (percent >= 60) return 1.3;
    if (percent >= 50) return 1.0;
    return 0.0;
}

function calculateCourseFinal(assignments, studentId) {
    let weightedSum = 0;
    let totalWeight = 0;

    let simpleSum = 0;
    let simpleCount = 0;

    assignments.forEach(assignment => {
        const grades = assignment.grades || {};
        const score = grades[studentId];

        if (score !== undefined && score !== null && score !== "") {
            const numericScore = Number(score);

            if (!isNaN(numericScore)) {
                simpleSum += numericScore;
                simpleCount++;

                const weight = Number(String(assignment.weight).replace("%", ""));
                if (!isNaN(weight) && weight > 0) {
                    weightedSum += numericScore * weight;
                    totalWeight += weight;
                }
            }
        }
    });

    if (totalWeight > 0) {
        return weightedSum / totalWeight;
    }

    if (simpleCount > 0) {
        return simpleSum / simpleCount;
    }

    return null;
}

function renderGPATable(coursesWithFinals) {
    const tableBody = document.getElementById("gpaTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!coursesWithFinals.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">No graded courses available.</td>
            </tr>
        `;
        return;
    }

    coursesWithFinals.forEach(course => {
        const row = document.createElement("tr");

        const finalGradeText =
            course.finalGrade !== null ? `${course.finalGrade.toFixed(1)}%` : "N/A";

        const gpaText =
            course.finalGrade !== null ? percentageToGPA(course.finalGrade).toFixed(1) : "N/A";

        row.innerHTML = `
            <td>${course.code || course.name || "Unknown Course"}</td>
            <td>${course.credits || "N/A"}</td>
            <td>${finalGradeText}</td>
            <td>${gpaText}</td>
        `;

        tableBody.appendChild(row);
    });
}

function estimateGPA(coursesWithFinals) {
    let totalPoints = 0;
    let totalCredits = 0;

    coursesWithFinals.forEach(course => {
        const finalGrade = course.finalGrade;
        const credits = Number(course.credits);

        if (finalGrade !== null && !isNaN(credits) && credits > 0) {
            const gpaPoints = percentageToGPA(finalGrade);
            totalPoints += gpaPoints * credits;
            totalCredits += credits;
        }
    });

    if (totalCredits === 0) return null;
    return (totalPoints / totalCredits).toFixed(2);
}

function renderGPA(gpa) {
    const gpaElement = document.getElementById("gpaEstimate");
    if (!gpaElement) return;

    gpaElement.textContent = gpa !== null
        ? `Estimated GPA: ${gpa}`
        : "Estimated GPA: N/A";
}

async function fetchCourses() {
    try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        return await res.json();
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

async function fetchAssignmentsForCourse(courseId) {
    try {
        const res = await fetch(`/api/assignments/course/${courseId}`);
        if (!res.ok) throw new Error(`Failed to fetch assignments for course ${courseId}`);
        return await res.json();
    } catch (error) {
        console.error("Error fetching assignments:", error);
        return [];
    }
}

async function calculateAndDisplayGPA() {
    const userDataString = localStorage.getItem("user");
    if (!userDataString) {
        renderGPA(null);
        return;
    }

    const userData = JSON.parse(userDataString);
    console.log("userData:", userData);

    if (userData.role !== "student") {
        renderGPA(null);
        return;
    }

    const studentId = userData.uid || userData._id;
    const enrolledIds = new Set(userData.enrolledCourses || []);
    const allCourses = await fetchCourses();
    console.log("allCourses:", allCourses);

    const studentCourses = allCourses.filter(course => enrolledIds.has(course.id));
    console.log("studentCourses:", studentCourses);

    const coursesWithFinals = [];

    for (const course of studentCourses) {
        const assignments = await fetchAssignmentsForCourse(course.id);
        console.log("course:", course.name || course.code);
        console.log("assignments full:", JSON.stringify(assignments, null, 2));
        console.log("studentId used:", studentId);

        const finalGrade = calculateCourseFinal(assignments, studentId);
        console.log("finalGrade:", finalGrade);

        coursesWithFinals.push({
            ...course,
            finalGrade
        });
    }

    console.log("coursesWithFinals:", coursesWithFinals);

    const gpa = estimateGPA(coursesWithFinals);
    renderGPA(gpa);
    renderGPATable(coursesWithFinals);

    const exportBtn = document.getElementById("exportCsvBtn");
    if (exportBtn) {
        exportBtn.onclick = () => exportGradesToCSV(coursesWithFinals);
    }

    const exportPdfBtn = document.getElementById("exportPdfBtn");
    if (exportPdfBtn) {
        exportPdfBtn.onclick = () => exportGradesToPDF(coursesWithFinals, gpa);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    calculateAndDisplayGPA();
});