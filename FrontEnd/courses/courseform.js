//(Josh) JS for course section

async function loadHtmlIntoBody(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHtmlIntoBody("courses/components/addCourseModal.html");
    await loadHtmlIntoBody("courses/components/deleteCourseModal.html");
    await loadHtmlIntoBody("courses/components/enrollCourseModal.html");
    await loadHtmlIntoBody("courses/components/unenrollCourseModal.html");

    setupAddCourseModal();
    setupSafeDeleteModal();
    setupEnrollCourseModal();
    setupUnenrollCourseModal();
    renderCourses();
});

async function getCatalog() {
    try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error fetching catalog:", err);
        return [];
    }
}

async function addCourseToBackend(courseObj) {
    try {
        const res = await fetch("/api/courses/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(courseObj)
        });
        if (!res.ok) throw new Error(`Failed to add course: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error adding course:", err);
        return null;
    }
}

async function deleteCourseFromBackend(id) {
    try {
        const res = await fetch(`/api/courses/delete/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Failed to delete course: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error deleting course:", err);
        return null;
    }
}

async function enrollInCourseInBackend(courseId, studentId) {
    try {
        const res = await fetch("/api/courses/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, studentId })
        });
        if (!res.ok) throw new Error(`Failed to enroll: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error enrolling in course:", err);
        return null;
    }
}

async function unenrollFromCourseInBackend(courseId, studentId) {  // NEW
    try {
        const res = await fetch("/api/courses/unenroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, studentId })
        });
        if (!res.ok) throw new Error(`Failed to unenroll: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error unenrolling from course:", err);
        return null;
    }
}

// Add course modal
function setupAddCourseModal() {
    const addBoxes = document.querySelectorAll(".teacher-only .addCourseBox");
    const modal = document.getElementById("addCourseModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const form = document.getElementById("addCourseForm");

    if (!modal || !form) return;

    function openModal() {
        modal.classList.remove("hidden");
        const codeInput = document.getElementById("mCourseCode");
        if (codeInput) codeInput.focus();
    }

    function closeModal() {
        modal.classList.add("hidden");
        form.reset();
    }

    addBoxes.forEach(box => { box.onclick = openModal; });
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    form.onsubmit = async (e) => {
        e.preventDefault();

        let code = document.getElementById("mCourseCode").value.trim();
        let name = document.getElementById("mCourseName").value.trim();
        let credits = document.getElementById("mCredits").value.trim();
        let section = document.getElementById("mSection").value.trim();
        let schedule = document.getElementById("mSchedule").value.trim();
        const template = document.getElementById("mTemplate").value;

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const teacherId = user.uid || "";
        const instructorName = `${user.fname || ""} ${user.lname || ""}`.trim();

        if (template === "programming") {
            if (!code) code = "SOEN 287";
            if (!name) name = "Web Programming";
            if (!credits) credits = "3";
            if (!section) section = "AA";
            if (!schedule) schedule = "Tue/Thu 2:45–4:00";
        } else if (template === "theory") {
            if (!code) code = "COMP 232";
            if (!name) name = "Mathematics for Computer Science";
            if (!credits) credits = "3";
            if (!section) section = "BB";
            if (!schedule) schedule = "Mon/Wed 10:15–11:30";
        } else if (template === "lab") {
            if (!code) code = "SOEN 228";
            if (!name) name = "System Hardware";
            if (!credits) credits = "1.5";
            if (!section) section = "L";
            if (!schedule) schedule = "Fri 2:45–5:30";
        }

        if (!code || !name) {
            alert("Please enter at least a course code and course name, or choose a template.");
            return;
        }

        const result = await addCourseToBackend({
            code,
            name,
            credits,
            section,
            instructor: instructorName,
            schedule,
            teacherId
        });

        if (!result) {
            alert("Failed to add course to backend");
            return;
        }

        if (teacherId) {
            if (!user.teachingClasses) user.teachingClasses = [];
            user.teachingClasses.push(result.id);
            localStorage.setItem("user", JSON.stringify(user));
        }

        renderCourses();
        closeModal();
    };
}

// Delete course modal (teacher)
function setupSafeDeleteModal() {
    const userRole = getRole();

    if (userRole !== "teacher" && userRole !== "admin") {
        document.querySelectorAll(".deleteBtn").forEach(btn => btn.style.display = "none");
        return;
    }

    const deleteModal = document.getElementById("deleteCourseModal");
    const deleteText = document.getElementById("deleteText");
    const deleteInput = document.getElementById("deleteConfirmInput");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const closeBtn = document.getElementById("closeDeleteModalBtn");
    const cancelBtn = document.getElementById("cancelDeleteBtn");

    let courseBoxToDelete = null;
    let requiredCode = "";

    function openDeleteModal(courseBox) {
        courseBoxToDelete = courseBox;
        const codeEl = courseBox.querySelector(".courseCode");
        const nameEl = courseBox.querySelector(".courseName");
        requiredCode = codeEl ? codeEl.textContent.trim() : "";
        const name = nameEl ? nameEl.textContent.trim() : "";
        deleteText.textContent = `You are about to remove ${requiredCode}${name ? " — " + name : ""}. To confirm, type: ${requiredCode}`;
        deleteInput.value = "";
        confirmBtn.disabled = true;
        deleteModal.classList.remove("hidden");
        deleteInput.focus();
    }

    function closeDeleteModal() {
        deleteModal.classList.add("hidden");
        courseBoxToDelete = null;
        requiredCode = "";
    }

    deleteInput.addEventListener("input", () => {
        confirmBtn.disabled = deleteInput.value.trim().toUpperCase() !== requiredCode.trim().toUpperCase();
    });

    confirmBtn.addEventListener("click", async () => {
        if (!courseBoxToDelete) return;
        const courseId = courseBoxToDelete.dataset.id;
        if (!courseId) { courseBoxToDelete.remove(); closeDeleteModal(); return; }

        const success = await deleteCourseFromBackend(courseId);
        if (!success) { alert("Failed to delete course from backend"); return; }

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.teachingClasses) user.teachingClasses = user.teachingClasses.filter(id => id !== courseId);
        localStorage.setItem("user", JSON.stringify(user));

        renderCourses();
        window.dispatchEvent(new Event("enrollmentchange"));
        closeDeleteModal();
    });

    closeBtn.addEventListener("click", closeDeleteModal);
    cancelBtn.addEventListener("click", closeDeleteModal);
    deleteModal.addEventListener("click", (e) => { if (e.target === deleteModal) closeDeleteModal(); });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !deleteModal.classList.contains("hidden")) closeDeleteModal();
    });

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".deleteBtn");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const box = btn.closest(".courseBox");
        if (!box || box.classList.contains("addCourseBox")) return;
        openDeleteModal(box);
    });
}

// Unenroll modal (student) (Sahon)
function setupUnenrollCourseModal() {
    const userRole = getRole();
    if (userRole !== "student") return;

    const modal = document.getElementById("unenrollCourseModal");
    if (!modal) return;

    const unenrollText = document.getElementById("unenrollText");
    const unenrollInput = document.getElementById("unenrollConfirmInput");
    const confirmBtn = document.getElementById("confirmUnenrollBtn");
    const closeBtn = document.getElementById("closeUnenrollModalBtn");
    const cancelBtn = document.getElementById("cancelUnenrollBtn");

    let targetCourseBox = null; // The chosen course the student chose to unenroll from
    let requiredCode = ""; // The code requierd to unenroll, aka the code of the course

    // Opens when student clicks "Unenroll" button
    function openModal(courseBox) {
        // Displays popup
        targetCourseBox = courseBox;
        const codeEl = courseBox.querySelector(".courseCode");
        const nameEl = courseBox.querySelector(".courseName");
        requiredCode = codeEl ? codeEl.textContent.trim() : "";
        const name = nameEl ? nameEl.textContent.trim() : "";
        // Confirmation code
        unenrollText.textContent = `You are about to unenroll from ${requiredCode}${name ? " — " + name : ""}. To confirm, type: ${requiredCode}`;
        unenrollInput.value = "";
        confirmBtn.disabled = true;
        modal.classList.remove("hidden");
        unenrollInput.focus();
    }

    // Closing popup
    function closeModal() {
        modal.classList.add("hidden");
        targetCourseBox = null;
        requiredCode = "";
    }

    // Confirm button is disabled until the requiredcode matches the input
    unenrollInput.addEventListener("input", () => {
        confirmBtn.disabled = unenrollInput.value.trim().toUpperCase() !== requiredCode.trim().toUpperCase();
    });

    // Unenroll button clicked
    confirmBtn.addEventListener("click", async () => {
        if (!targetCourseBox) return;
        const courseId = targetCourseBox.dataset.id;
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const studentId = user.uid;

        if (!courseId || !studentId) { alert("Could not identify course or student."); return; }

        const success = await unenrollFromCourseInBackend(courseId, studentId); // Backend call to unenroll
        if (!success) { alert("Failed to unenroll. Please try again."); return; }

        // Update local user object
        if (user.enrolledCourses) {
            user.enrolledCourses = user.enrolledCourses.filter(id => id !== courseId);
        }
        localStorage.setItem("user", JSON.stringify(user));

        renderCourses();
        window.dispatchEvent(new Event("enrollmentchange"));
        closeModal();
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    // Listen for clicks on unenroll buttons (event delegation)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".unenrollBtn");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const box = btn.closest(".courseBox");
        if (!box || box.classList.contains("addCourseBox")) return;
        openModal(box);
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function setupEnrollCourseModal() {
    const studentEnrollBox = document.querySelector(".student-only .addCourseBox");
    const modal = document.getElementById("enrollCourseModal");
    const closeBtn = document.getElementById("closeEnrollModalBtn");
    const cancelBtn = document.getElementById("cancelEnrollBtn");
    const form = document.getElementById("enrollCourseForm");
    const select = document.getElementById("enrollSelect");

    if (!modal || !form || !select) return;

    async function openModal() {
        const catalog = await getCatalog();
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const enrolledIds = new Set(user.enrolledCourses || []);
        // Filter out courses that are already enrolled OR are disabled
        const choices = catalog.filter(c => !enrolledIds.has(c.id) && c.isEnabled !== false);

        select.innerHTML = "";
        if (choices.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = catalog.length === 0
                ? "No courses available (teacher must create one)"
                : "No more courses to enroll in";
            select.appendChild(opt);
            select.disabled = true;
        } else {
            select.disabled = false;
            choices.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = `${c.code} — ${c.name || ""}`.trim();
                select.appendChild(opt);
            });
        }

        modal.classList.remove("hidden");
        select.focus();
    }

    function closeModal() { modal.classList.add("hidden"); form.reset(); }

    if (studentEnrollBox) studentEnrollBox.onclick = openModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const courseId = select.value;
        if (!courseId) return;

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const studentId = user.uid;

        if (!studentId) { alert("Please log in to enroll."); return; }

        const success = await enrollInCourseInBackend(courseId, studentId);
        if (success) {
            if (!user.enrolledCourses) user.enrolledCourses = [];
            if (!user.enrolledCourses.includes(courseId)) {
                user.enrolledCourses.push(courseId);
                localStorage.setItem("user", JSON.stringify(user));
            }
            renderCourses();
            window.dispatchEvent(new Event("enrollmentchange"));
            closeModal();
        } else {
            alert("Failed to enroll.");
        }
    };
}

async function renderCourses() {
    const role = getRole();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const enrolledIds = new Set(user.enrolledCourses || []);
    const teachingIds = new Set(user.teachingClasses || []);
    const catalog = await getCatalog();
    const coursesContainer = document.querySelector(".coursesContainer");
    if (!coursesContainer) return;

    document.querySelectorAll(".courseBox:not(.addCourseBox)").forEach(box => box.remove());

    catalog.forEach(course => {
        const id = course.id;
        if (role === "student" && !enrolledIds.has(id)) return;
        if (role === "teacher" && !teachingIds.has(id)) return;

        const card = document.createElement("a");
        card.className = "courseBox";
        card.dataset.id = course.id;
        card.href = `courses/course.html?id=${encodeURIComponent(course.id)}`;
        card.style.textDecoration = "none";
        card.style.color = "inherit";

        card.innerHTML = `
          <div class="courseMain">
            <div class="courseCode">${escapeHtml(course.code)}</div>
            <div class="courseName">${escapeHtml(course.name)}</div>
          </div>
          <div class="courseExtra">
            <p><strong>Credits:</strong> ${escapeHtml(course.credits || "")}</p>
            ${course.section ? `<p><strong>Section:</strong> ${escapeHtml(course.section)}</p>` : ""}
            ${course.instructor ? `<p><strong>Instructor:</strong> ${escapeHtml(course.instructor)}</p>` : ""}
            ${course.schedule ? `<p><strong>Schedule:</strong> ${escapeHtml(course.schedule)}</p>` : ""}

            <div class="courseActions">
              <!-- Teacher sees Remove, Student sees Unenroll -->
              <button class="deleteBtn teacher-role-btn" type="button" style="display:none;">Remove</button>
              <button class="unenrollBtn student-role-btn" type="button" style="display:none;">Unenroll</button>
            </div>
          </div>
        `;

        // Show the right button based on role
        const deleteBtn = card.querySelector(".deleteBtn");
        const unenrollBtn = card.querySelector(".unenrollBtn");
        if (deleteBtn) deleteBtn.style.display = (role === "teacher" || role === "admin") ? "block" : "none";
        if (unenrollBtn) unenrollBtn.style.display = (role === "student") ? "block" : "none";

        const refNode = coursesContainer.querySelector(".student-only, .teacher-only");
        if (refNode) coursesContainer.insertBefore(card, refNode);
        else coursesContainer.appendChild(card);
    });

    setupAddCourseModal();
    setupEnrollCourseModal();
    setupUnenrollCourseModal();
}

window.addEventListener("rolechange", renderCourses);
window.addEventListener("enrollmentchange", renderCourses);