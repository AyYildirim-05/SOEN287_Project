const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const gradesController = require("../controller/gradesController");
const teacherGradesController = require("../controller/teacherGradesController");
const adminGradesController = require("../controller/adminGradesController");

router.get("/my-courses", verifyToken, gradesController.getStudentCoursesForGraph);
router.get("/teacher-overview", verifyToken, teacherGradesController.getTeacherCoursesForGraph);
router.get("/admin-overview/all", verifyToken, adminGradesController.getAllCoursesGradesForAdmin);
 
module.exports = router;