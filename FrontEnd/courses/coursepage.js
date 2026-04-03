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
    renderGradeList();
    drawGradesChart();

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
   ASSIGNMENTS (index-style boxes)
   ===================================================== */

async function fetchAndRenderAssignments() {
  const container = document.getElementById("assignmentsSection");
  if (!container) {
    return;
  }

  container.innerHTML = "<p>Loading assignments...</p>";

  const courseId = new URLSearchParams(window.location.search).get("id"); //getCourseCodeFromUrl() would break
  
  // Get actual user ID from localStorage
  const userDataString = localStorage.getItem("user");
  let studentId = "TEST_STUDENT_UID"; // Fallback
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    studentId = userData.uid || userData._id || studentId;
  }

  try {
    const assignRes = await fetch(`http://localhost:5500/api/assignments/course/${courseId}`);
    if (!assignRes.ok) throw new Error("Failed to fetch assignments");
    const assignments = await assignRes.json();

    let completedList = [];
    /*
    try {
      const studentRes = await fetch(`http://localhost:5500/api/students/${studentId}`);
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        completedList = studentData.completedAssignments || [];
      }
    } catch (e) {
      console.warn("Could not fetch student completion data. Skipping checks.", e);
    }
      */

    container.innerHTML = ""; // Clear loading text

    if (assignments.length === 0) {
      container.innerHTML = "<p>No assignments for this course yet.</p>";
      return;
    }

    assignments.forEach(a => {
      const isCompleted = completedList.includes(a.id);
      const dueDateString = a.dueDate 
      ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "No due date";
      const weightDisplay = a.weight ? `Weight: ${a.weight}` : "";

      const box = document.createElement("div");
      box.className = "assignmentBox";

      box.innerHTML = `
    <div class="assignmentText">
      <h4>Due: ${dueDateString}</h4>
      <p class="weightText">${weightDisplay}</p> <h5>${a.title}</h5>
      <p>${courseData.name || courseData.code}</p>
    </div>

    <div class="assignmentActions">
      <label>
        Completed
        <input type="checkbox" class="completion-checkbox" data-id="${a.id}" ${isCompleted ? "checked" : ""}>
      </label>

<button class="removeAssignmentBtn" data-id="${a.id}" type="button">Remove</button>    </div>
    `;

      container.appendChild(box);
    });

    // make checkboxes save their status for completed or uncompleted assignments to database when clicked
    document.querySelectorAll(".completion-checkbox").forEach(checkbox => {
      checkbox.addEventListener("change", async (e) => {
        const assignmentId = e.target.getAttribute("data-id");
        const isChecked = e.target.checked;

        try {
          const res = await fetch("http://localhost:5500/api/assignments/toggle-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: studentId,
              assignmentId: assignmentId,
              isCompleted: isChecked
            })
          });
          if (!res.ok) throw new Error("Database failed to update");
        } catch (err) {
          console.error(err);
          alert("Could not update completion status on server.");
          e.target.checked = !isChecked; // Revert the visual checkmark if DB fails
        }
      });
    });
  } catch (error) {
    console.error("Error displaying assignments:", error);
    container.innerHTML = "<p>Error loading assignments.</p>";
  }
}

/* =====================================================
   ANNOUNCEMENTS
   ===================================================== */

function renderAnnouncements() {
  const list = document.getElementById("announcementList");
  if (!list || !courseData) return;

  list.innerHTML = "";

  (courseData.announcements || []).forEach(a => {
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
  if (!list || !courseData) return;

  list.innerHTML = "";

  const grades = courseData.grades || [];
  grades.forEach(g => {
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
  if (!canvas || !courseData) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  const maxY = 100;
  const barGap = 20;
  const grades = courseData.grades || [];
  const barCount = grades.length;

  if (barCount === 0) return;

  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#cccccc";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();

  grades.forEach((g, i) => {
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

  saveBtn.addEventListener("click", async () => {
    // get input values using ID
    const titleInput = document.getElementById("assignmentTitle");
    const dueDateInput = document.getElementById("assignmentDue");
    const weightInput = document.getElementById("assignmentWeight");

    if (!titleInput || !dueDateInput || !weightInput) {
      console.error("Error: Cannot find input IDs in the HTML.");
      return;
    }

    // get Course ID from URL and Teacher ID from localStorage
    const title = titleInput.value.trim();
    const dueDate = dueDateInput.value;
    const weight = weightInput.value.trim();
    const courseId = new URLSearchParams(window.location.search).get("id"); //getCourseCodeFromUrl(); wouldn't work

    // Get actual teacher ID from localStorage
    const userDataString = localStorage.getItem("user");
    let teacherId = "TEMPORARY_TEACHER_ID"; // Fallback
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      teacherId = userData.uid || userData._id || teacherId;
    }

    if (!title || !dueDate) {
      alert("Please fill out both the title and due date.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5500/api/assignments/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId,
          title: title,
          dueDate: dueDate,
          weight: weight,
          teacherId: teacherId
        })
      });

      if (response.ok) {
        titleInput.value = "";
        dueDateInput.value = "";
        weightInput.value = "";
        close();
        await fetchAndRenderAssignments(); // Refresh list immediately
      } else {
        alert("Failed to save assignment.");
      }
    } catch (error) {
      console.error("Failed to save assignments: ", error);
    }
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
    document.getElementById("editCourseTitle").value = courseData.name;
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

    courseData.name = title;
    courseData.instructor = instructor;
    courseData.credits = credits;

    localStorage.setItem(getCourseInfoKey(), JSON.stringify({ title, instructor, credits, tas }));

    renderCourseInfo();
    close();
  });
}

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

/*
  Remove Buttons
*/

document.addEventListener("click", async (e) => {
  const removeAssignmentBtn = e.target.closest(".removeAssignmentBtn");
  if (removeAssignmentBtn) {
    e.preventDefault();
    e.stopPropagation();

    const assignmentId = removeAssignmentBtn.dataset.id;

    try {
      const res = await fetch(`http://localhost:5500/api/assignments/${assignmentId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete assignment");

      await fetchAndRenderAssignments();
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
  //await fetchAndRenderAssignments();

  renderAnnouncements();
  renderGradeList();
  drawGradesChart();

  await loadHtmlIntoBody("components/addAssignmentModal.html");
  await loadHtmlIntoBody("components/editCourseInfoModal.html");
  await loadHtmlIntoBody("components/addAnnouncementModal.html");

  setupAddAssignmentModal();
  setupEditCourseInfoModal();
  setupAddAnnouncementModal();
});