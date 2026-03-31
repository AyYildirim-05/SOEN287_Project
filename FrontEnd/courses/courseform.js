//(Josh) JS for course section

function initDefaultEnrollment() {
    let enrolled = JSON.parse(localStorage.getItem("enrolledCourses")) || [];

    if (enrolled.length === 0) {
        enrolled = ["SOEN287"]; // choose your default
        localStorage.setItem("enrolledCourses", JSON.stringify(enrolled));
    }
}

//Loading html elements in
async function loadHtmlIntoBody(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
}

document.addEventListener("DOMContentLoaded", async () => {

    // Loads modal HTML components first
    await loadHtmlIntoBody("courses/components/addCourseModal.html");
    await loadHtmlIntoBody("courses/components/deleteCourseModal.html");
    await loadHtmlIntoBody("courses/components/enrollCourseModal.html");

    // Runs setup logic
    setupAddCourseModal();
    setupSafeDeleteModal();
    initDefaultEnrollment();
    setupEnrollCourseModal();
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
        const res = await fetch(`/api/courses/delete/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error(`Failed to delete course: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error deleting course:", err);
        return null;
    }
}

//Add course modal
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

    addBoxes.forEach(box => {
        box.onclick = openModal;
    });

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    form.onsubmit = async (e) => {
        e.preventDefault();

        const code = document.getElementById("mCourseCode").value.trim();
        const name = document.getElementById("mCourseName").value.trim();
        const credits = document.getElementById("mCredits").value.trim();
        const section = document.getElementById("mSection").value.trim();
        const instructor = document.getElementById("mInstructor").value.trim();
        const schedule = document.getElementById("mSchedule").value.trim();

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const teacherId = user.uid || "";

        const result = await addCourseToBackend({ code, name, credits, section, instructor, schedule, teacherId });
        if (!result) {
            alert("Failed to add course to backend");
            return;
        }

        renderCourses();
        closeModal();
    };
}

//Delete course modal
function setupSafeDeleteModal() {

    const userRole = getRole();

    if (userRole !== "teacher") {
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

        deleteText.textContent =
            `You are about to remove ${requiredCode}${name ? " — " + name : ""}. To confirm, type: ${requiredCode}`;

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
        const typed = deleteInput.value.trim().toUpperCase();
        const needed = requiredCode.trim().toUpperCase();
        confirmBtn.disabled = typed !== needed;
    });

    confirmBtn.addEventListener("click", async () => {
        if (!courseBoxToDelete) return;
        
        const courseId = courseBoxToDelete.dataset.id;
        if (!courseId) {
            console.error("No course ID found for deletion");
            // Fallback for hardcoded courses or legacy data
            const updatedCatalog = (await getCatalog()).filter(
                c => (c.code || "").toUpperCase() !== requiredCode.toUpperCase()
            );
            // This fallback might not work as intended without localStorage
            courseBoxToDelete.remove();
            closeDeleteModal();
            return;
        }

        const success = await deleteCourseFromBackend(courseId);
        if (!success) {
            alert("Failed to delete course from backend");
            return;
        }

        // Remove from enrolled list too (still using localStorage for now as per original code)
        const updatedEnrolled = getEnrolledCourses().filter(
            c => c.toUpperCase() !== requiredCode.toUpperCase()
        );
        setEnrolledCourses(updatedEnrolled);

        renderCourses();
        window.dispatchEvent(new Event("enrollmentchange"));
        closeDeleteModal();
    });

    closeBtn.addEventListener("click", closeDeleteModal);
    cancelBtn.addEventListener("click", closeDeleteModal);

    deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !deleteModal.classList.contains("hidden")) closeDeleteModal();
    });

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".deleteBtn");
        if (!btn) return;

        const box = btn.closest(".courseBox");
        if (!box || box.classList.contains("addCourseBox")) return;

        const codeEl = box.querySelector(".courseCode");
        if (!codeEl) return;

        openDeleteModal(box);
    });

}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getEnrolledCourses() {
    return JSON.parse(localStorage.getItem("enrolledCourses")) || [];
}
function setEnrolledCourses(arr) {
    localStorage.setItem("enrolledCourses", JSON.stringify(arr));
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
        const enrolled = new Set(getEnrolledCourses().map(c => c.toUpperCase()));

        // Only show courses not already enrolled
        const choices = catalog.filter(c => c.code && !enrolled.has(c.code.toUpperCase()));

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
                opt.value = c.code;
                opt.textContent = `${c.code} — ${c.name || ""}`.trim();
                select.appendChild(opt);
            });
        }

        modal.classList.remove("hidden");
        select.focus();
    }

    function closeModal() {
        modal.classList.add("hidden");
        form.reset();
    }

    if (studentEnrollBox) studentEnrollBox.onclick = openModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const code = select.value;
        if (!code) return;

        const enrolled = getEnrolledCourses();
        if (!enrolled.includes(code)) {
            enrolled.push(code);
            setEnrolledCourses(enrolled);
            window.dispatchEvent(new Event("enrollmentchange"));
        }

        closeModal();
    };
}

async function renderCourses() {
    const role = getRole();
    const enrolled = new Set(getEnrolledCourses().map(c => c.toUpperCase()));
    const catalog = await getCatalog();
    const coursesContainer = document.querySelector(".coursesContainer");
    if (!coursesContainer) return;
    
    // Clear existing dynamic courses (keep add course boxes)
    document.querySelectorAll(".courseBox:not(.addCourseBox)").forEach(box => box.remove());

    catalog.forEach(course => {
        const code = (course.code || "").toUpperCase();
        
        // Logic from original renderCourses
        if (role === "student" && !enrolled.has(code)) {
            return;
        }

        const card = document.createElement("a");
        card.className = "courseBox";
        card.dataset.id = course.id;
        card.href = `courses/course.html?code=${encodeURIComponent(course.code)}`;
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
          <button class="deleteBtn" type="button">Remove</button>
        </div>
      </div>
    `;

        // The delete button visibility is also role-dependent
        const delBtn = card.querySelector(".deleteBtn");
        if (delBtn) {
            delBtn.style.display = (role === "teacher") ? "block" : "none";
        }

        // Insert before the wrapper (which IS a direct child of coursesContainer)
        const refNode = coursesContainer.querySelector(".student-only, .teacher-only");
        if (refNode) coursesContainer.insertBefore(card, refNode);
        else coursesContainer.appendChild(card);
    });

    // Re-attach listeners to the 'Add Course' and 'Enroll' boxes because they are within the container
    // and might have been affected or need re-initialization if they were hidden/shown
    setupAddCourseModal();
    setupEnrollCourseModal();
}

window.addEventListener("rolechange", renderCourses);
window.addEventListener("enrollmentchange", renderCourses);