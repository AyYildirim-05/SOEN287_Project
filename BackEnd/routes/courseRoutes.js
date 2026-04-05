const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");

// Add a course
router.post("/add", courseController.addCourse);

// Get all courses
router.get("/", courseController.getAllCourses);

// Get one course by id
router.get("/:id", courseController.getCourseById);

// Get people in a course
router.get("/:id/people", courseController.getPeopleInCourse);

// Delete a course
router.delete("/delete/:id", courseController.deleteCourse);

// Enroll in a course
router.post("/enroll", courseController.enrollInCourse);

// Unenroll from a course (student-only) 
router.post("/unenroll", courseController.unenrollFromCourse);

//Update announcements for a course
router.put("/:id/announcements", courseController.updateAnnouncements);

module.exports = router;