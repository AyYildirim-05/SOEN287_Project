/* =====================================================
   HARD-CODED COURSE DATA
   (For Frontend Deliverable)
   ===================================================== */

const courseData = {
  title: "SOEN 287 - Web Programming",
  instructor: "Abdel",
  credits: "3 Credits",

  assignments: [
    { title: "Assignment 1", due: "Feb 28, 2026", weight: "15%" },
    { title: "Midterm Project", due: "March 15, 2026", weight: "25%" },
    { title: "Final Report", due: "April 10, 2026", weight: "30%" }
  ],

  announcements: [
    "Assignment 1 has been posted.",
    "Midterm will be held in class.",
    "Project proposal due next week."
  ],

  grades: [
    { name: "Assignment 1", grade: 85 },
    { name: "Midterm", grade: 78 },
    { name: "Assignment 2", grade: 92 }
  ]
};


/* =====================================================
   COURSE INFO
   ===================================================== */

function renderCourseInfo() {
  document.getElementById("courseTitle").textContent = courseData.title;
  document.getElementById("courseInstructor").textContent =
    "Instructor: " + courseData.instructor;
  document.getElementById("courseCredits").textContent =
    "Credits: " + courseData.credits;
}


/* =====================================================
   ASSIGNMENT CARDS
   ===================================================== */

function renderAssignments() {
  const list = document.getElementById("assignmentList");
  list.innerHTML = "";

  courseData.assignments.forEach(a => {
    const card = document.createElement("div");
    card.className = "assignmentCard";

    card.innerHTML = `
      <div class="assignmentHeader">
        <strong>${a.title}</strong>
      </div>
      <div class="assignmentDetails">
        <p>Due: ${a.due}</p>
        <p>Weight: ${a.weight}</p>
      </div>
    `;

    list.appendChild(card);
  });
}


/* =====================================================
   ANNOUNCEMENTS
   ===================================================== */

function renderAnnouncements() {
  const list = document.getElementById("announcementList");
  list.innerHTML = "";

  courseData.announcements.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    list.appendChild(li);
  });
}


/* =====================================================
   GRADE LIST
   ===================================================== */

function renderGradeList() {
  const list = document.getElementById("gradeList");
  if (!list) return;

  list.innerHTML = "";

  courseData.grades.forEach(g => {
    const li = document.createElement("li");
    li.textContent = `${g.name}: ${g.grade}%`;
    list.appendChild(li);
  });
}


/* =====================================================
   GRADES BAR CHART (CANVAS)
   ===================================================== */

function drawGradesChart() {
  const canvas = document.getElementById("gradesCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  const maxY = 100;
  const barGap = 20;
  const barCount = courseData.grades.length;
  const barWidth =
    (chartWidth - barGap * (barCount - 1)) / barCount;

  // Axes
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#cccccc";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();

  // Bars
  courseData.grades.forEach((g, i) => {
    const barHeight = (g.grade / maxY) * chartHeight;
    const x = padding + i * (barWidth + barGap);
    const y = padding + chartHeight - barHeight;

    ctx.fillStyle = "#60a5fa"; // blue bars
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#333";
    ctx.font = "14px Trebuchet MS";
    ctx.fillText(`${g.grade}%`, x + 8, y - 8);

    ctx.fillText(
      g.name,
      x,
      padding + chartHeight + 18
    );
  });
}


/* =====================================================
   INITIALIZE PAGE
   ===================================================== */

window.addEventListener("DOMContentLoaded", () => {
  renderCourseInfo();
  renderAssignments();
  renderAnnouncements();
  renderGradeList();
  drawGradesChart();
});