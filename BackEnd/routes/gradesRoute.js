const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const gradesController = require("../controller/gradesController");

// GET /api/grades/my-courses
// Returns enrolled courses with assignment completion stats for the logged-in student
router.get("/my-courses", verifyToken, gradesController.getStudentCoursesForGraph);

module.exports = router;