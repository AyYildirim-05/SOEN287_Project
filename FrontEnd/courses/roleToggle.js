document.addEventListener("DOMContentLoaded", () => {

  const roleInputs = document.querySelectorAll('input[name="role"]');

  // Get saved role or default to student
  const savedRole = localStorage.getItem("role") || "student";

  roleInputs.forEach(radio => {
    radio.checked = (radio.value === savedRole);

    radio.addEventListener("change", () => {
      localStorage.setItem("role", radio.value);
      window.dispatchEvent(new Event("rolechange"));
    });
  });

});

function getRole() {
  const role = localStorage.getItem("role");
  if (role) return role;

  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.role) return user.role;
    } catch (e) {
      console.error("Error parsing user for role:", e);
    }
  }

  return "student";
}

function applyRoleUI() {
  const role = getRole();

  document.querySelectorAll(".teacher-only").forEach(el => {
    // If it's a courseBox wrapper, we might want flex, but block is safer for generic divs.
    // However, the addCourseBox itself is flex.
    el.style.display = (role === "teacher") ? "block" : "none";
  });

  document.querySelectorAll(".student-only").forEach(el => {
    el.style.display = (role === "student") ? "block" : "none";
  });

  // Optional: update a label if you have one
  const badge = document.getElementById("roleBadge");
  if (badge) badge.textContent = role.toUpperCase();
}

/* =====================================================
   A method for admins to have same controls as teacher. Used for editing and deleting as admin.
   ===================================================== */

function applyAdminAsTeacher() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;
  const user = JSON.parse(userStr);
  if (user.role !== "admin") return;

  // Admins get the same edit/remove controls as teachers
  document.querySelectorAll(".teacher-only").forEach(el => {
    el.style.display = "flex";
  });
}

// Apply on load + whenever toggle changes
document.addEventListener("DOMContentLoaded", applyRoleUI);
window.addEventListener("rolechange", applyRoleUI);