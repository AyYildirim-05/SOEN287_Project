const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const gradesController = require("../controller/gradesController");
const teacherGradesController = require("../controller/teacherGradesController");

// GET /api/grades/my-courses
// Returns enrolled courses with assignment completion stats for the logged-in student
router.get("/my-courses", verifyToken, gradesController.getStudentCoursesForGraph);
router.get("/teacher-overview", verifyToken, teacherGradesController.getTeacherCoursesForGraph);
 
module.exports = router;