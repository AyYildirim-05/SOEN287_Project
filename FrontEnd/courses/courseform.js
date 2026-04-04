//(Josh) JS for course section

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

        //reading template
        const template = document.getElementById("mTemplate").value;

        // Template auto-fill
        const templateSelect = document.getElementById("mTemplate");
        const codeInput = document.getElementById("mCourseCode");
        const nameInput = document.getElementById("mCourseName");
        const creditsInput = document.getElementById("mCredits");
        const sectionInput = document.getElementById("mSection");
        const instructorInput = document.getElementById("mInstructor");
        const scheduleInput = document.getElementById("mSchedule");

        if (templateSelect) {
            templateSelect.addEventListener("change", () => {
                const template = templateSelect.value;

                if (template === "programming") {
                    codeInput.value = "SOEN287";
                    nameInput.value = "Web Programming";
                    creditsInput.value = "3";
                    sectionInput.value = "AA";
                    instructorInput.value = "Default Instructor";
                    scheduleInput.value = "Monday 10:15 - 12:45";
                }
                else if (template === "theory") {
                    codeInput.value = "COMP232";
                    nameInput.value = "Mathematics for Computer Science";
                    creditsInput.value = "3";
                    sectionInput.value = "AA";
                    instructorInput.value = "Default Instructor";
                    scheduleInput.value = "Tuesday 14:00 - 16:30";
                }
                else if (template === "lab") {
                    codeInput.value = "SOEN228";
                    nameInput.value = "System Hardware";
                    creditsInput.value = "3";
                    sectionInput.value = "AB";
                    instructorInput.value = "Default Instructor";
                    scheduleInput.value = "Wednesday 13:15 - 15:45";
                }
                else {
                    // If "None" selected, clear fields
                    codeInput.value = "";
                    nameInput.value = "";
                    creditsInput.value = "";
                    sectionInput.value = "";
                    instructorInput.value = "";
                    scheduleInput.value = "";
                }
            });
        }

        const code = document.getElementById("mCourseCode").value.trim();
        const name = document.getElementById("mCourseName").value.trim();
        const credits = document.getElementById("mCredits").value.trim();
        const section = document.getElementById("mSection").value.trim();
        const instructor = document.getElementById("mInstructor").value.trim();
        const schedule = document.getElementById("mSchedule").value.trim();

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const teacherId = user.uid || "";
        const instructorName = `${user.fname || ""} ${user.lname || ""}`.trim();

        const result = await addCourseToBackend({ 
            code, 
            name, 
            credits, 
            section, 
            instructor: instructor || instructorName, 
            schedule, 
            teacherId,
            template
        });

        if (!result) {
            alert("Failed to add course to backend");
            return;
        }

        // Update local user object
        if (teacherId) {
            if (!user.teachingClasses) user.teachingClasses = [];
            user.teachingClasses.push(result.id);
            localStorage.setItem("user", JSON.stringify(user));
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

        // Update local user object
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.teachingClasses) {
            user.teachingClasses = user.teachingClasses.filter(id => id !== courseId);
        }
        if (user.enrolledCourses) {
            user.enrolledCourses = user.enrolledCourses.filter(id => id !== courseId);
        }
        localStorage.setItem("user", JSON.stringify(user));

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

    /**
     * Clicking the remove button on course boxes
     */
    document.addEventListener("click", (e) => {
    const btn = e.target.closest(".deleteBtn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

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
        // Since we are now storing enrollments in Firestore, we should ideally fetch the user's enrolled courses from the backend.
        // For now, to minimize changes, we'll keep using the local comparison if needed, 
        // but it's better to just show all courses and let the backend handle duplication if it exists.
        
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const enrolledIds = new Set((user.enrolledCourses || []));

        // Only show courses not already enrolled
        const choices = catalog.filter(c => !enrolledIds.has(c.id));

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
                opt.value = c.id; // Store ID as value
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

    form.onsubmit = async (e) => {
        e.preventDefault();
        const courseId = select.value;
        if (!courseId) return;

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const studentId = user.uid;

        if (!studentId) {
            alert("Please log in to enroll.");
            return;
        }

        const success = await enrollInCourseInBackend(courseId, studentId);
        if (success) {
            // Update local user object to reflect new enrollment
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
    
    // Clear existing dynamic courses (keep add course boxes)
    document.querySelectorAll(".courseBox:not(.addCourseBox)").forEach(box => box.remove());

    catalog.forEach(course => {
        const id = course.id;
        
        // Show if student is enrolled OR if teacher created it
        if (role === "student" && !enrolledIds.has(id)) {
            return;
        }
        
        if (role === "teacher" && !teachingIds.has(id)) {
            // Option: Show all courses to teachers, or only theirs.
            // Based on user's request, adding created class to teacher's array implies they should see theirs.
            return;
        }

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