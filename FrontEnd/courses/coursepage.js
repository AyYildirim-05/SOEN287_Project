/* =====================================================
   HARD-CODED COURSE DATA
   (For Frontend Deliverable)
   ===================================================== */

const courseData = {
  title: "SOEN 287 - Web Programming",
  instructor: "Abdel",
  credits: "3 Credits",
  tas: ["TA One", "TA Two"],

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
   SMALL HELPERS
   ===================================================== */

async function loadHtmlIntoBody(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

function getCourseCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("code") || "SOEN287").toUpperCase();
}

function getCourseInfoKey() {
  return `courseInfo:${getCourseCodeFromUrl()}`;
}

function loadSavedCourseInfoIntoCourseData() {
  const saved = JSON.parse(localStorage.getItem(getCourseInfoKey()) || "null");
  if (!saved) return;

  courseData.title = saved.title ?? courseData.title;
  courseData.instructor = saved.instructor ?? courseData.instructor;
  courseData.credits = saved.credits ?? courseData.credits;
  courseData.tas = saved.tas ?? courseData.tas;
}

/* =====================================================
   COURSE INFO
   ===================================================== */

function renderCourseInfo() {
  document.getElementById("courseTitle").textContent = courseData.title;
  document.getElementById("courseInstructor").textContent =
    "Instructor: " + courseData.instructor;
  document.getElementById("courseCredits").textContent =
    "Credits: " + courseData.credits;

  const taText = (courseData.tas && courseData.tas.length > 0)
    ? courseData.tas.join(", ")
    : "None";

  document.getElementById("courseTAs").textContent = "TAs: " + taText;
}

/* =====================================================
   ASSIGNMENTS (index-style boxes)
   ===================================================== */

function renderAssignments() {
  const container = document.getElementById("assignmentsSection");
  if (!container) return;

  container.innerHTML = "";

  courseData.assignments.forEach(a => {
    const box = document.createElement("div");
    box.className = "assignmentBox";

    box.innerHTML = `
      <div class="assignmentText">
        <h4>${a.due}</h4>
        <p>Weight: ${a.weight}</p>
        <h5>${a.title}</h5>
        <p>${courseData.title}</p>
      </div>

      <label>
        Completed <input type="checkbox">
      </label>
    `;

    container.appendChild(box);
  });
}

/* =====================================================
   ANNOUNCEMENTS
   ===================================================== */

function renderAnnouncements() {
  const list = document.getElementById("announcementList");
  if (!list) return;

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

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  const maxY = 100;
  const barGap = 20;
  const barCount = courseData.grades.length;
  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount;

  // axes
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#cccccc";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();

  // bars
  courseData.grades.forEach((g, i) => {
    const barHeight = (g.grade / maxY) * chartHeight;
    const x = padding + i * (barWidth + barGap);
    const y = padding + chartHeight - barHeight;

    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#333";
    ctx.font = "14px Trebuchet MS";
    ctx.fillText(`${g.grade}%`, x + 8, y - 8);
    ctx.fillText(g.name, x, padding + chartHeight + 18);
  });
}

/* =====================================================
   MODALS: Add Assignment + Edit Course Info
   ===================================================== */

function setupAddAssignmentModal() {
  const addBtn = document.getElementById("addAssignmentBtn");
  const overlay = document.getElementById("addAssignmentOverlay"); // NOTE: overlay ID
  const cancelBtn = document.getElementById("cancelAssignmentBtn");
  const closeBtn = document.getElementById("closeAssignmentModalBtn");
  const saveBtn = document.getElementById("saveAssignmentBtn");

  if (!addBtn || !overlay || !cancelBtn || !saveBtn) {
    console.warn("Add Assignment modal elements missing. Check IDs and that modal HTML loaded.");
    return;
  }

  const close = () => overlay.classList.add("hidden");

  addBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    const titleEl = document.getElementById("assignmentTitle");
    if (titleEl) titleEl.focus();
  });

  cancelBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  saveBtn.addEventListener("click", () => {

    const title = document.getElementById("editCourseTitle").value.trim();
    const instructor = document.getElementById("editCourseInstructor").value.trim();
    const credits = document.getElementById("editCourseCredits").value.trim();

    const tasRaw = document.getElementById("editCourseTAs").value.trim();

    const tas = tasRaw
      ? tasRaw.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    if (!title || !instructor || !credits) {
      alert("Please fill all fields.");
      return;
    }

    courseData.title = title;
    courseData.instructor = instructor;
    courseData.credits = credits;
    courseData.tas = tas;

    renderCourseInfo();

    close();
  });
}

function setupEditCourseInfoModal() {
  const editBtn = document.getElementById("editCourseInfoBtn");
  const overlay = document.getElementById("editCourseInfoOverlay");
  const cancelBtn = document.getElementById("cancelEditCourseInfoBtn");
  const closeBtn = document.getElementById("closeEditCourseInfoBtn");
  const saveBtn = document.getElementById("saveCourseInfoBtn");

  if (!editBtn || !overlay || !cancelBtn || !saveBtn) {
    // if you haven't added the edit button/modal yet, don't crash
    return;
  }

  const close = () => overlay.classList.add("hidden");

  editBtn.addEventListener("click", () => {
    document.getElementById("editCourseTitle").value = courseData.title;
    document.getElementById("editCourseInstructor").value = courseData.instructor;
    document.getElementById("editCourseCredits").value = courseData.credits;
    document.getElementById("editCourseTAs").value =
      (courseData.tas || []).join(", ");

    overlay.classList.remove("hidden");
    document.getElementById("editCourseTitle").focus();
  });

  cancelBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  saveBtn.addEventListener("click", () => {
    const title = document.getElementById("editCourseTitle").value.trim();
    const instructor = document.getElementById("editCourseInstructor").value.trim();
    const credits = document.getElementById("editCourseCredits").value.trim();

    if (!title || !instructor || !credits) {
      alert("Please fill all fields.");
      return;
    }

    courseData.title = title;
    courseData.instructor = instructor;
    courseData.credits = credits;

    localStorage.setItem(getCourseInfoKey(), JSON.stringify({ title, instructor, credits, tas }));

    renderCourseInfo();
    close();
  });

  function setupAddAnnouncementModal() {

    const addBtn = document.getElementById("addAnnouncementBtn");
    const overlay = document.getElementById("addAnnouncementOverlay");
    const cancelBtn = document.getElementById("cancelAnnouncementBtn");
    const closeBtn = document.getElementById("closeAnnouncementModalBtn");
    const saveBtn = document.getElementById("saveAnnouncementBtn");

    if (!addBtn || !overlay) return;

    const close = () => overlay.classList.add("hidden");

    addBtn.addEventListener("click", () => {
      overlay.classList.remove("hidden");
      document.getElementById("announcementTextInput").focus();
    });

    cancelBtn.addEventListener("click", close);
    closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    saveBtn.addEventListener("click", () => {

      const text =
        document.getElementById("announcementTextInput").value.trim();

      if (!text) {
        alert("Please enter an announcement.");
        return;
      }

      courseData.announcements.unshift(text);

      renderAnnouncements();

      document.getElementById("announcementTextInput").value = "";
      close();
    });

  }
}

/* =====================================================
   INITIALIZE PAGE
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // 1) load saved course info (so the top card shows saved values)
  loadSavedCourseInfoIntoCourseData();

  // 2) render the page
  renderCourseInfo();
  renderAssignments();
  renderAnnouncements();
  renderGradeList();
  drawGradesChart();

  // 3) load modal components
  // (course.html is in /courses, so components/... is correct)
  await loadHtmlIntoBody("components/addAssignmentModal.html");
  await loadHtmlIntoBody("components/editCourseInfoModal.html");
  await loadHtmlIntoBody("components/addAnnouncementModal.html");

  // 4) setup modal behaviors
  setupAddAssignmentModal();
  setupEditCourseInfoModal();
  setupAddAnnouncementModal();
});