const express = require("express");
const router = express.Router();
const assignmentController = require("../controller/assignmentController");

router.post("/add", assignmentController.addAssignment);
router.get("/course/:courseId", assignmentController.getAssignmentsByCourse);
router.post("/toggle-completion", assignmentController.toggleCompletion);
router.get("/all", assignmentController.getAllAssignments);

module.exports = router;