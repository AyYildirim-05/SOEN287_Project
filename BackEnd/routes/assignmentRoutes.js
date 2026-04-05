const express = require("express");
const router = express.Router();
const assignmentController = require("../controller/assignmentController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/add", assignmentController.addAssignment);
router.get("/course/:courseId", assignmentController.getAssignmentsByCourse);
router.post("/toggle-completion", assignmentController.toggleCompletion);
router.get("/all", assignmentController.getAllAssignments);
router.delete("/:id", assignmentController.deleteAssignment);
router.post("/grade", verifyToken, assignmentController.gradeAssignment);
router.put("/:id", assignmentController.editAssignment); 

module.exports = router;