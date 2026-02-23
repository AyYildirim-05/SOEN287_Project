const courses = {
  SOEN287: {
    title: "SOEN 287 – Web Programming",
    instructor: "Abdel",
    credits: 3,
    announcements: [
      "Assignment 2 released",
      "Midterm next week"
    ],
    assignments: [
      "Assignment 1 – HTML Basics",
      "Assignment 2 – JavaScript"
    ],
    grades: [
      "Assignment 1: 85%",
      "Midterm: 78%"
    ]
  },

  SOEN228: {
    title: "SOEN 228 – System Hardware",
    instructor: "Prof. X",
    credits: 3,
    announcements: [
      "Lab 3 posted",
      "Quiz on Friday"
    ],
    assignments: [
      "Lab 1 – Flip Flops",
      "Lab 2 – Timing Diagrams"
    ],
    grades: [
      "Lab 1: 92%",
      "Quiz 1: 88%"
    ]
  }
};

const params = new URLSearchParams(window.location.search);
const code = params.get("code");

const course = courses[code];

if (course) {
  document.getElementById("courseTitle").textContent = course.title;
  document.getElementById("courseInstructor").textContent =
    "Instructor: " + course.instructor;
  document.getElementById("courseCredits").textContent =
    "Credits: " + course.credits;

  const announcementList = document.getElementById("announcementList");
  course.announcements.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    announcementList.appendChild(li);
  });

  const assignmentList = document.getElementById("assignmentList");
  course.assignments.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    assignmentList.appendChild(li);
  });

  const gradeList = document.getElementById("gradeList");
  course.grades.forEach(g => {
    const li = document.createElement("li");
    li.textContent = g;
    gradeList.appendChild(li);
  });

} else {
  document.getElementById("courseTitle").textContent = "Course Not Found";
}