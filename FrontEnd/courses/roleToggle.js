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
  return localStorage.getItem("role") || "student";
}

function applyRoleUI() {
  const role = getRole();

  document.querySelectorAll(".teacher-only").forEach(el => {
    el.style.display = (role === "teacher") ? "" : "none";
  });

  document.querySelectorAll(".student-only").forEach(el => {
    el.style.display = (role === "student") ? "" : "none";
  });

  // Optional: update a label if you have one
  const badge = document.getElementById("roleBadge");
  if (badge) badge.textContent = role.toUpperCase();
}

// Apply on load + whenever toggle changes
document.addEventListener("DOMContentLoaded", applyRoleUI);
window.addEventListener("rolechange", applyRoleUI);