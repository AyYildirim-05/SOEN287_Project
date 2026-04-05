const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");

//update courseinfo
router.put("/:id", courseController.updateCourse);

// Update course status (enable/disable)
router.put("/:id/status", courseController.updateCourseStatus);

// Add a course
router.post("/add", courseController.addCourse);

// Get all courses
router.get("/", courseController.getAllCourses);

// Get one course by id
router.get("/:id", courseController.getCourseById);

// Get people in a course
router.get("/:id/people", courseController.getPeopleInCourse);

//update announcements
router.put("/:id/announcements", courseController.updateAnnouncements);

// Delete a course
router.delete("/delete/:id", courseController.deleteCourse);

// Enroll in a course
router.post("/enroll", courseController.enrollInCourse);

// Unenroll from a course
router.post("/unenroll", courseController.unenrollFromCourse);

// Remove teacher from a course
router.post("/remove-teacher", courseController.removeTeacherFromCourse);

module.exports = router;
