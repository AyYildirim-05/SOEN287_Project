const express = require("express");
const router = express.Router();
const teacherController = require("../controller/teacherController");

router.get("/getallteachers", teacherController.getAllTeachers);
router.get("/:id", teacherController.getTeacherById);

module.exports = router;
