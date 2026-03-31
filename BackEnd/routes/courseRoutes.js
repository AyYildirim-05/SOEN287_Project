const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");

// Add a course
router.post("/add", courseController.addCourse);

// Get all courses
router.get("/", courseController.getAllCourses);

// Delete a course
router.delete("/delete/:id", courseController.deleteCourse);

module.exports = router;
