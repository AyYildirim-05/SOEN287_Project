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
    seedCatalogFromPageIfEmpty();
    setupEnrollCourseModal();
    renderCourses();

});

function getCatalog() {
    return JSON.parse(localStorage.getItem("courseCatalog")) || [];
}

function setCatalog(catalog) {
    localStorage.setItem("courseCatalog", JSON.stringify(catalog));
}

function seedCatalogFromPageIfEmpty() {
    const catalog = getCatalog();
    if (catalog.length > 0) return;

    const seeded = [];

    document.querySelectorAll("a.courseBox").forEach(a => {
        // skip the extra boxes (they are divs, but just in case)
        if (a.classList.contains("addCourseBox")) return;

        const code = a.querySelector(".courseCode")?.textContent?.trim();
        const name = a.querySelector(".courseName")?.textContent?.trim();

        if (code && name) {
            seeded.push({
                code,
                name,
                credits: "",     
                section: "",
                instructor: "",
                schedule: ""
            });
        }
    });

    if (seeded.length > 0) setCatalog(seeded);
}

function upsertCatalogCourse(courseObj) {
    const catalog = getCatalog();
    const idx = catalog.findIndex(c => (c.code || "").toUpperCase() === courseObj.code.toUpperCase());
    if (idx >= 0) catalog[idx] = courseObj;
    else catalog.push(courseObj);
    setCatalog(catalog);
}

//Add course modal
function setupAddCourseModal() {
    const addBoxes = document.querySelectorAll(".teacher-only .addCourseBox"); const modal = document.getElementById("addCourseModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const form = document.getElementById("addCourseForm");
    const coursesContainer = document.querySelector(".coursesContainer");

    let activeWrapper = null;

    function openModal(clickedBox) {
        activeWrapper = clickedBox.closest(".student-only, .teacher-only") || clickedBox;
        modal.classList.remove("hidden");
        document.getElementById("mCourseCode").focus();
    }

    function closeModal() {
        modal.classList.add("hidden");
        form.reset();
        activeWrapper = null;
    }

    // Attach click to both boxes
    addBoxes.forEach(box => {
        box.addEventListener("click", () => openModal(box));
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const code = document.getElementById("mCourseCode").value.trim();
        const name = document.getElementById("mCourseName").value.trim();
        const credits = document.getElementById("mCredits").value.trim();
        const section = document.getElementById("mSection").value.trim();
        const instructor = document.getElementById("mInstructor").value.trim();
        const schedule = document.getElementById("mSchedule").value.trim();
        upsertCatalogCourse({ code, name, credits, section, instructor, schedule });

        const card = document.createElement("a");
        card.className = "courseBox";
        card.href = `courses/course.html?code=${encodeURIComponent(code)}`;
        card.style.textDecoration = "none";
        card.style.color = "inherit";

        card.innerHTML = `
      <div class="courseMain">
        <div class="courseCode">${escapeHtml(code)}</div>
        <div class="courseName">${escapeHtml(name)}</div>
      </div>
      <div class="courseExtra">
        <p><strong>Credits:</strong> ${escapeHtml(credits)}</p>
        ${section ? `<p><strong>Section:</strong> ${escapeHtml(section)}</p>` : ""}
        ${instructor ? `<p><strong>Instructor:</strong> ${escapeHtml(instructor)}</p>` : ""}
        ${schedule ? `<p><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>` : ""}

        <div class="courseActions">
          <button class="deleteBtn" type="button">Remove</button>
        </div>
      </div>
    `;

        // Insert before the wrapper (which IS a direct child of coursesContainer)
        const refNode = activeWrapper && activeWrapper.parentElement === coursesContainer
            ? activeWrapper
            : coursesContainer.querySelector(".student-only, .teacher-only"); // fallback

        if (refNode) coursesContainer.insertBefore(card, refNode);
        else coursesContainer.appendChild(card);

        closeModal();
    });
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

    confirmBtn.addEventListener("click", () => {
        if (!courseBoxToDelete) return;
        // Remove from catalog
        const updatedCatalog = getCatalog().filter(
            c => (c.code || "").toUpperCase() !== requiredCode.toUpperCase()
        );
        setCatalog(updatedCatalog);

        // Remove from enrolled list too
        const updatedEnrolled = getEnrolledCourses().filter(
            c => c.toUpperCase() !== requiredCode.toUpperCase()
        );
        setEnrolledCourses(updatedEnrolled);

        courseBoxToDelete.remove();
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
    const studentEnrollBox = document.querySelector(".student-only .addCourseBox"); // the extra box in index.html :contentReference[oaicite:7]{index=7}
    const modal = document.getElementById("enrollCourseModal");
    const closeBtn = document.getElementById("closeEnrollModalBtn");
    const cancelBtn = document.getElementById("cancelEnrollBtn");
    const form = document.getElementById("enrollCourseForm");
    const select = document.getElementById("enrollSelect");

    if (!studentEnrollBox || !modal || !form || !select) return;

    function openModal() {
        const catalog = getCatalog();
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

    studentEnrollBox.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener("submit", (e) => {
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
    });
}

function renderCourses() {
    const role = getRole();
    const enrolled = new Set(getEnrolledCourses().map(c => c.toUpperCase()));

    document.querySelectorAll(".courseBox").forEach(box => {
        if (box.classList.contains("addCourseBox")) return;

        const codeEl = box.querySelector(".courseCode");
        if (!codeEl) return;

        const code = codeEl.textContent.trim().toUpperCase();

        if (role === "student") {
            box.style.display = enrolled.has(code) ? "" : "none";
        } else {
            box.style.display = "";
        }
    });
}

window.addEventListener("rolechange", renderCourses);
window.addEventListener("enrollmentchange", renderCourses);