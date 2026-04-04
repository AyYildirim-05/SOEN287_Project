const express = require("express");
const router = express.Router();
const teacherController = require("../controller/teacherController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/getallteachers", teacherController.getAllTeachers);
router.get("/getteacher", verifyToken, teacherController.getTeacherController);
router.put("/updateteacher", verifyToken, teacherController.updateTeacherController);
router.get("/:id", teacherController.getTeacherById);

module.exports = router;
