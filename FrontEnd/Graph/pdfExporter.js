function exportGradesToPDF(coursesWithFinals, overallGpa) {
    if (!coursesWithFinals || coursesWithFinals.length === 0) {
        alert("No grade data to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.text("Grades Report", 20, y);

    y += 12;
    doc.setFontSize(12);
    doc.text(`Estimated Overall GPA: ${overallGpa ?? "N/A"}`, 20, y);

    y += 15;
    doc.setFontSize(11);

    doc.text("Course", 20, y);
    doc.text("Credits", 90, y);
    doc.text("Final Grade", 120, y);
    doc.text("GPA", 170, y);

    y += 5;
    doc.line(20, y, 190, y);
    y += 10;

    coursesWithFinals.forEach(course => {
        const courseLabel = `${course.code || ""} ${course.name || ""}`.trim();
        const credits = String(course.credits || "N/A");
        const finalGrade = course.finalGrade !== null ? `${course.finalGrade.toFixed(1)}%` : "N/A";
        const gpa = course.finalGrade !== null ? percentageToGPA(course.finalGrade).toFixed(1) : "N/A";

        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.text(courseLabel, 20, y);
        doc.text(credits, 90, y);
        doc.text(finalGrade, 120, y);
        doc.text(gpa, 170, y);

        y += 10;
    });

    doc.save("grades_report.pdf");
}