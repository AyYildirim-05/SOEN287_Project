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
    await loadHtmlIntoBody("components/addCourseModal.html");
    await loadHtmlIntoBody("components/deleteCourseModal.html");

    // Runs setup logic
    setupAddCourseModal();
    setupSafeDeleteModal();

});

//Add course modal
function setupAddCourseModal() {

    const addBox = document.querySelector(".addCourseBox");
    const modal = document.getElementById("addCourseModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const form = document.getElementById("addCourseForm");
    const coursesContainer = document.querySelector(".coursesContainer");

    function openModal() {
        modal.classList.remove("hidden");
        document.getElementById("mCourseCode").focus();
    }

    function closeModal() {
        modal.classList.add("hidden");
        form.reset();
    }

    addBox?.addEventListener("click", openModal);
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

        const card = document.createElement("a");
card.className = "courseBox";
card.href = `course.html?code=${encodeURIComponent(code)}`;
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

        coursesContainer.insertBefore(card, addBox);
        closeModal();
    });

}

//Delete course modal
function setupSafeDeleteModal() {

    const userRole = "teacher";

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
        courseBoxToDelete.remove();
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