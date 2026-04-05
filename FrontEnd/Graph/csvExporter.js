function csvSafe(value) {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
}

function exportGradesToCSV(coursesWithFinals) {
    if (!coursesWithFinals || coursesWithFinals.length === 0) {
        alert("No grade data to export.");
        return;
    }

    let csv = "Course Code,Course Name,Credits,Final Grade (%),GPA\n";

    coursesWithFinals.forEach(course => {
        const finalGrade =
            course.finalGrade !== null ? course.finalGrade.toFixed(1) : "N/A";

        const gpa =
            course.finalGrade !== null ? percentageToGPA(course.finalGrade).toFixed(1) : "N/A";

        const row = [
            csvSafe(course.code),
            csvSafe(course.name),
            csvSafe(course.credits),
            csvSafe(finalGrade),
            csvSafe(gpa)
        ];

        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "grades_report.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
}