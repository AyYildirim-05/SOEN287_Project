const express = require("express");
const router = express.Router();
const assignmentController = require("../controller/assignmentController");

router.post("/add", assignmentController.addAssignment);
router.get("/course/:courseId", assignmentController.getAssignmentByCourse);
router.post("/toggle-completion", assignmentController.toggleCompletion);

module.exports = router;