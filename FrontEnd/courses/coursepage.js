/**
 * Course Loading
 */
const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");
let courseData = null;

/* =====================================================
   SMALL HELPERS
   ===================================================== */

async function loadCourseFromBackend() {
  if (!courseId) {
    console.error("No course ID in URL.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5500/api/courses/${courseId}`);
    if (!res.ok) throw new Error("Failed to load course.");

    courseData = await res.json();

    renderCourseInfo();
    await fetchAndRenderAssignments();
    renderAnnouncements();
    await drawCoursePageGraph(); // replaces the old hardcoded drawGradesChart()

  } catch (error) {
    console.error("Error loading course:", error);
  }
}

async function loadHtmlIntoBody(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

function getCourseInfoKey() {
  return `courseInfo:${courseId}`;
}

/* =====================================================
   COURSE INFO
   ===================================================== */

function renderCourseInfo() {
  document.getElementById("courseTitle").textContent =
    courseData.name || courseData.code || "";

  document.getElementById("courseInstructor").textContent =
    "Instructor: " + (courseData.instructor || "");

  document.getElementById("courseCredits").textContent =
    "Credits: " + (courseData.credits || "");

  const taText = (courseData.tas && courseData.tas.length > 0)
    ? courseData.tas.join(", ")
    : "None";

  document.getElementById("courseTAs").textContent = "TAs: " + taText;
}

/* =====================================================
   ASSIGNMENTS
   ===================================================== */

async function fetchAndRenderAssignments() {
  const container = document.getElementById("assignmentsSection");
  if (!container) return;

  container.innerHTML = "<p>Loading assignments...</p>";

  const userDataString = localStorage.getItem("user");
  let studentId = null;
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    studentId = userData.uid || userData._id || null;
  }

  try {
    const assignRes = await fetch(`http://localhost:5500/api/assignments/course/${courseId}`);
    if (!assignRes.ok) throw new Error("Failed to fetch assignments");
    const assignments = await assignRes.json();

    container.innerHTML = "";

    if (assignments.length === 0) {
      container.innerHTML = "<p>No assignments for this course yet.</p>";
      return;
    }

    assignments.forEach(a => {
      const dueDateString = a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "No due date";
      const weightDisplay = a.weight ? `Weight: ${a.weight}` : "";

      const existingGrade = a.grades && studentId && a.grades[studentId] !== undefined
        ? a.grades[studentId]
        : null;

      const gradeDisplayText = existingGrade !== null
        ? `Grade: ${existingGrade}%`
        : "No grade yet";

      const box = document.createElement("div");
      box.className = "assignmentBox";

      box.innerHTML = `
        <div class="assignmentText">
          <h4>Due: ${dueDateString}</h4>
          <p class="weightText">${weightDisplay}</p>
          <h5>${a.title}</h5>
          <p>${courseData.name || courseData.code}</p>
          <p style="color:#666; font-size:13px;">${a.description || ""}</p>
        </div>

        <div class="assignmentActions">
          <label>
            Completed
            <input type="checkbox" class="completion-checkbox" data-id="${a.id}">
          </label>

          <div class="student-only">
            <span class="gradeDisplay" id="gradeDisplay-${a.id}">${gradeDisplayText}</span>
            <button
              class="enterGradeBtn"
              type="button"
              data-id="${a.id}"
              data-title="${a.title.replace(/"/g, '&quot;')}"
              data-current="${existingGrade !== null ? existingGrade : ''}"
            >
              Enter Grade
            </button>
          </div>

          <button class="removeAssignmentBtn teacher-only" data-id="${a.id}" type="button">Remove</button>
        </div>
      `;

      container.appendChild(box);
    });

    document.querySelectorAll(".completion-checkbox").forEach(checkbox => {
      checkbox.addEventListener("change", async (e) => {
        const assignmentId = e.target.getAttribute("data-id");
        const isChecked = e.target.checked;

        try {
          const res = await fetch("http://localhost:5500/api/assignments/toggle-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, assignmentId, isCompleted: isChecked })
          });
          if (!res.ok) throw new Error("Database failed to update");
        } catch (err) {
          console.error(err);
          alert("Could not update completion status on server.");
          e.target.checked = !isChecked;
        }
      });
    });

    if (typeof applyRoleUI === "function") applyRoleUI();

  } catch (error) {
    console.error("Error displaying assignments:", error);
    container.innerHTML = "<p>Error loading assignments.</p>";
  }
}

/* =====================================================
   COURSE PAGE GRAPH (role-aware)
   ===================================================== */

async function drawCoursePageGraph() {
  const canvas = document.getElementById("gradesCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Helper: draw a status message as a DOM element (avoids blurry canvas text)
  function showGraphMessage(text, color = "#aaa") {
    const existing = canvas.parentElement.querySelector(".graph-status-msg");
    if (existing) existing.remove();
    canvas.style.display = "none";
    const msg = document.createElement("p");
    msg.className = "graph-status-msg";
    msg.textContent = text;
    msg.style.cssText = `color:${color}; font-family:'Trebuchet MS',Arial,sans-serif; font-size:14px; text-align:center; margin:auto; padding:20px 0;`;
    canvas.parentElement.appendChild(msg);
  }

  function clearGraphMessage() {
    const existing = canvas.parentElement.querySelector(".graph-status-msg");
    if (existing) existing.remove();
    canvas.style.display = "";
  }

  if (!token || !userStr) {
    showGraphMessage("Log in to see grades.");
    return;
  }

  const user = JSON.parse(userStr);

  // Destroy any previous chart before drawing a new one
  if (window._coursePageChartInstance) {
    window._coursePageChartInstance.destroy();
    window._coursePageChartInstance = null;
  }

  // ── STUDENT: one bar per assignment in this course ──────────────
  if (user.role === "student") {
    showGraphMessage("Loading your grades\u2026");

    let assignments = [];
    try {
      const res = await fetch(`http://localhost:5500/api/grades/my-assignments/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      assignments = await res.json();
    } catch (err) {
      console.error("coursepage graph: failed to fetch assignment grades:", err);
      showGraphMessage("Could not load grades.", "#e55");
      return;
    }

    if (!assignments.length) {
      showGraphMessage("No assignments in this course yet.");
      return;
    }

    // Only show assignments that have a grade entered
    const graded = assignments.filter(a => a.grade !== null);

    if (!graded.length) {
      showGraphMessage("No grades entered yet.");
      return;
    }

    clearGraphMessage();

    const labels = graded.map(a => a.title);
    const data   = graded.map(a => a.grade);

    const backgroundColors = data.map(v => {
      if (v >= 80) return "rgba(74, 222, 128, 0.75)";
      if (v >= 60) return "rgba(251, 191, 36, 0.75)";
      return "rgba(248, 113, 113, 0.75)";
    });
    const borderColors = backgroundColors.map(c => c.replace("0.75", "1"));

    window._coursePageChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Your Grade (%)",
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
              label: (ctx) => {
                const a = graded[ctx.dataIndex];
                return [` Grade: ${a.grade}%`, ` Weight: ${a.weight}`];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => v + "%", font: { family: "Trebuchet MS", size: 11 } },
            grid: { color: "rgba(0,0,0,0.06)" }
          },
          x: {
            ticks: { font: { family: "Trebuchet MS", size: 11 } },
            grid: { display: false }
          }
        }
      }
    });

    return;
  }

  // ── TEACHER + ADMIN: one bar per student in this course ─────────
  if (user.role === "teacher" || user.role === "admin") {
    showGraphMessage("Loading student grades\u2026");

    let data;
    try {
      const res = await fetch(`http://localhost:5500/api/grades/admin-overview/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error("coursepage graph: failed to fetch student grades:", err);
      showGraphMessage("Could not load student grades.", "#e55");
      return;
    }

    const { students } = data;

    if (!students || !students.length) {
      showGraphMessage("No students enrolled in this course yet.");
      return;
    }

    clearGraphMessage();

    const labels = students.map(s => s.name);
    const gradeData = students.map(s => s.courseGrade ?? 0);
    const rawGrades = students.map(s => s.courseGrade);

    const backgroundColors = rawGrades.map(g => {
      if (g === null) return "rgba(200, 200, 200, 0.75)"; // grey = no grades yet
      if (g >= 80)   return "rgba(74, 222, 128, 0.75)";
      if (g >= 60)   return "rgba(251, 191, 36, 0.75)";
      return "rgba(248, 113, 113, 0.75)";
    });
    const borderColors = backgroundColors.map(c => c.replace("0.75", "1"));

    window._coursePageChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Student Average (%)",
          data: gradeData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6,
          _rawGrades: rawGrades
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = rawGrades[ctx.dataIndex];
                if (raw === null) return ` ${students[ctx.dataIndex].name}: No grades yet`;
                return ` ${students[ctx.dataIndex].name}: ${raw}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => v + "%", font: { family: "Trebuchet MS", size: 11 } },
            grid: { color: "rgba(0,0,0,0.06)" }
          },
          x: {
            ticks: { font: { family: "Trebuchet MS", size: 11 } },
            grid: { display: false }
          }
        }
      }
    });

    return;
  }

  showGraphMessage("Grade graph not available for this role.");
}

/* =====================================================
   GRADE MODAL (student-only)
   ===================================================== */

function setupGradeModal() {
  const overlay    = document.getElementById("gradeModalOverlay");
  const closeBtn   = document.getElementById("closeGradeModalBtn");
  const cancelBtn  = document.getElementById("cancelGradeBtn");
  const saveBtn    = document.getElementById("saveGradeBtn");
  const scoreInput = document.getElementById("gradeScoreInput");
  const titleEl    = document.getElementById("gradeModalAssignmentTitle");

  if (!overlay) return;

  let activeAssignmentId = null;

  const close = () => {
    overlay.classList.add("hidden");
    scoreInput.value = "";
    activeAssignmentId = null;
  };

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".enterGradeBtn");
    if (!btn) return;

    activeAssignmentId = btn.dataset.id;
    titleEl.textContent = btn.dataset.title;
    scoreInput.value = btn.dataset.current;
    overlay.classList.remove("hidden");
    scoreInput.focus();
  });

  saveBtn.addEventListener("click", async () => {
    const score = Number(scoreInput.value);

    if (scoreInput.value === "" || isNaN(score) || score < 0 || score > 100) {
      alert("Please enter a score between 0 and 100.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5500/api/assignments/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ assignmentId: activeAssignmentId, score })
      });

      if (!res.ok) throw new Error("Failed to save grade.");

      // Update grade display on the card
      const gradeDisplay = document.getElementById(`gradeDisplay-${activeAssignmentId}`);
      if (gradeDisplay) gradeDisplay.textContent = `Grade: ${score}%`;

      const btn = document.querySelector(`.enterGradeBtn[data-id="${activeAssignmentId}"]`);
      if (btn) btn.dataset.current = score;

      close();

      // Refresh the graph with the new grade
      await drawCoursePageGraph();

    } catch (err) {
      console.error("Error saving grade:", err);
      alert("Could not save grade. Please try again.");
    }
  });
}

/* =====================================================
   ANNOUNCEMENTS
   ===================================================== */

function renderAnnouncements() {
  const list = document.getElementById("announcementList");
  if (!list || !courseData) return;

  list.innerHTML = "";

  (courseData.announcements || []).forEach((a, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="announcementRow">
        <span>${a}</span>
        <button class="removeAnnouncementBtn teacher-only" data-index="${index}" type="button">Remove</button>
      </div>
    `;
    list.appendChild(li);
  });

  if (typeof applyRoleUI === "function") applyRoleUI();
}

/* =====================================================
   MODALS
   ===================================================== */

function setupAddAssignmentModal() {
  const addBtn    = document.getElementById("addAssignmentBtn");
  const overlay   = document.getElementById("addAssignmentOverlay");
  const cancelBtn = document.getElementById("cancelAssignmentBtn");
  const closeBtn  = document.getElementById("closeAssignmentModalBtn");
  const saveBtn   = document.getElementById("saveAssignmentBtn");

  if (!addBtn || !overlay || !cancelBtn || !saveBtn) return;

  const close = () => overlay.classList.add("hidden");

  addBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    const titleEl = document.getElementById("assignmentTitle");
    if (titleEl) titleEl.focus();
  });

  cancelBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  saveBtn.addEventListener("click", async () => {
    const titleInput   = document.getElementById("assignmentTitle");
    const dueDateInput = document.getElementById("assignmentDue");
    const weightInput  = document.getElementById("assignmentWeight");

    if (!titleInput || !dueDateInput || !weightInput) return;

    const title   = titleInput.value.trim();
    const dueDate = dueDateInput.value;
    const weight  = weightInput.value.trim();

    const userDataString = localStorage.getItem("user");
    let teacherId = "";
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      teacherId = userData.uid || userData._id || "";
    }

    if (!title || !dueDate) {
      alert("Please fill out both the title and due date.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5500/api/assignments/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title, dueDate, weight, teacherId })
      });

      if (response.ok) {
        titleInput.value = "";
        dueDateInput.value = "";
        weightInput.value = "";
        close();
        await fetchAndRenderAssignments();
        await drawCoursePageGraph();
      } else {
        alert("Failed to save assignment.");
      }
    } catch (error) {
      console.error("Failed to save assignment:", error);
    }
  });
}

function setupEditCourseInfoModal() {
  const editBtn   = document.getElementById("editCourseInfoBtn");
  const overlay   = document.getElementById("editCourseInfoOverlay");
  const cancelBtn = document.getElementById("cancelEditCourseInfoBtn");
  const closeBtn  = document.getElementById("closeEditCourseInfoBtn");
  const saveBtn   = document.getElementById("saveCourseInfoBtn");

  if (!editBtn || !overlay || !cancelBtn || !saveBtn) return;

  const close = () => overlay.classList.add("hidden");

  editBtn.addEventListener("click", () => {
    document.getElementById("editCourseTitle").value      = courseData.name || "";
    document.getElementById("editCourseInstructor").value = courseData.instructor || "";
    document.getElementById("editCourseCredits").value    = courseData.credits || "";
    document.getElementById("editCourseTAs").value        = (courseData.tas || []).join(", ");
    overlay.classList.remove("hidden");
    document.getElementById("editCourseTitle").focus();
  });

  cancelBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  saveBtn.addEventListener("click", () => {
    const title      = document.getElementById("editCourseTitle").value.trim();
    const instructor = document.getElementById("editCourseInstructor").value.trim();
    const credits    = document.getElementById("editCourseCredits").value.trim();

    if (!title || !instructor || !credits) {
      alert("Please fill all fields.");
      return;
    }

    courseData.name       = title;
    courseData.instructor = instructor;
    courseData.credits    = credits;

    renderCourseInfo();
    close();
  });
}

function setupAddAnnouncementModal() {
  const addBtn    = document.getElementById("addAnnouncementBtn");
  const overlay   = document.getElementById("addAnnouncementOverlay");
  const cancelBtn = document.getElementById("cancelAnnouncementBtn");
  const closeBtn  = document.getElementById("closeAnnouncementModalBtn");
  const saveBtn   = document.getElementById("saveAnnouncementBtn");

  if (!addBtn || !overlay) return;

  const close = () => overlay.classList.add("hidden");

  addBtn.addEventListener("click", () => {
    overlay.classList.remove("hidden");
    document.getElementById("announcementTextInput").focus();
  });

  cancelBtn.addEventListener("click", close);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  saveBtn.addEventListener("click", () => {
    const text = document.getElementById("announcementTextInput").value.trim();
    if (!text) { alert("Please enter an announcement."); return; }

    courseData.announcements = courseData.announcements || [];
    courseData.announcements.unshift(text);
    renderAnnouncements();
    document.getElementById("announcementTextInput").value = "";
    close();
  });
}

/* =====================================================
   REMOVE BUTTONS (event delegation)
   ===================================================== */

document.addEventListener("click", async (e) => {
  const removeAssignmentBtn = e.target.closest(".removeAssignmentBtn");
  if (removeAssignmentBtn) {
    e.preventDefault();
    e.stopPropagation();
    const assignmentId = removeAssignmentBtn.dataset.id;
    try {
      const res = await fetch(`http://localhost:5500/api/assignments/${assignmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assignment");
      await fetchAndRenderAssignments();
      await drawCoursePageGraph();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Could not delete assignment.");
    }
    return;
  }

  const removeAnnouncementBtn = e.target.closest(".removeAnnouncementBtn");
  if (removeAnnouncementBtn) {
    e.preventDefault();
    e.stopPropagation();
    const index = Number(removeAnnouncementBtn.dataset.index);
    courseData.announcements.splice(index, 1);
    renderAnnouncements();
  }
});

/* =====================================================
   INITIALIZE PAGE
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadCourseFromBackend();

  await loadHtmlIntoBody("components/addAssignmentModal.html");
  await loadHtmlIntoBody("components/editCourseInfoModal.html");
  await loadHtmlIntoBody("components/addAnnouncementModal.html");

  setupAddAssignmentModal();
  setupEditCourseInfoModal();
  setupAddAnnouncementModal();
  setupGradeModal();
});