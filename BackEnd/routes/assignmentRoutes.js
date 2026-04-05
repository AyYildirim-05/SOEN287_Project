const express = require("express");
const router = express.Router();
const assignmentController = require("../controller/assignmentController");
const { verifyToken } = require("../middleware/authMiddleware");
const { sendDeadlineReminder } = require("../utils/emailService");
const { db } = require("../database/firebase");

router.post("/send-reminders", verifyToken, async (req, res) => {
    try {
        const now = new Date();
        console.log("Starting reminder check at:", now);

        const snapshot = await db.collection("assignments").get();
        console.log("Assignments found:", snapshot.size);

        const loggedInUid = req.user.uid;
        const loggedInEmail = req.user.email;

        for (const doc of snapshot.docs) {
            const assignment = doc.data();
            console.log("Assignment doc:", doc.id, assignment);

            if (!assignment.dueDate) {
                console.log("Skipping assignment with no dueDate:", doc.id);
                continue;
            }

            let dueDate;

            if (assignment.dueDate && typeof assignment.dueDate.toDate === "function") {
                dueDate = assignment.dueDate.toDate();
            } else {
                dueDate = new Date(assignment.dueDate);
            }

            const diffTime = dueDate - now;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            console.log("Due date:", dueDate);
            console.log("Days until due:", diffDays);

            if (diffDays > 0 && diffDays <= 7) {
                const courseId = assignment.courseId;
                console.log("Course ID:", courseId);

                const courseDoc = await db.collection("courses").doc(courseId).get();
                if (!courseDoc.exists) {
                    console.log("Course not found for ID:", courseId);
                    continue;
                }

                const courseData = courseDoc.data();
                console.log("Course data:", courseData);

                const studentIds = courseData.studentIds || [];
                console.log("Student IDs:", studentIds);

                if (!studentIds.includes(loggedInUid)) {
                    console.log("Logged-in user is not enrolled in this course.");
                    continue;
                }

                if (loggedInEmail) {
                    await sendDeadlineReminder(
                        loggedInEmail,
                        assignment.title,
                        dueDate,
                        courseData.name || courseData.code || "Unknown Course"
                    );
                    console.log("Reminder sent to logged-in user:", loggedInEmail);
                } else {
                    console.log("No email found for logged-in user.");
                }
            } else {
                console.log("Skipping assignment not due within 7 days:", doc.id);
            }
        }

        res.status(200).json({ message: "Reminder emails sent." });
    } catch (error) {
        console.error("Error sending reminders:", error);
        res.status(500).json({ message: "Error sending reminders." });
    }
});

router.post("/add", assignmentController.addAssignment);
router.get("/course/:courseId", assignmentController.getAssignmentsByCourse);
router.post("/toggle-completion", assignmentController.toggleCompletion);
router.get("/all", assignmentController.getAllAssignments);
router.delete("/:id", assignmentController.deleteAssignment);
router.post("/grade", verifyToken, assignmentController.gradeAssignment);
router.put("/:id", assignmentController.editAssignment); 

module.exports = router;
