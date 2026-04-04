const { db } = require("../database/firebase");

// Get enrolled courses for the authenticated student, with grade data
exports.getStudentCoursesForGraph = async (req, res) => {
    try {
        const uid = req.user.uid; // Provided by authMiddleware

        // 1. Fetch the student document
        const studentDoc = await db.collection("students").doc(uid).get();
        if (!studentDoc.exists) {
            return res.status(404).json({ message: "Student not found." });
        }

        const studentData = studentDoc.data();
        const enrolledCourseIds = studentData.enrolledCourses || [];

        if (enrolledCourseIds.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Fetch each course document
        // Firestore "in" queries support up to 30 items, so we join them together in case we have more than 30
        const courseChunks = [];
        for (let i = 0; i < enrolledCourseIds.length; i += 30) {
            courseChunks.push(enrolledCourseIds.slice(i, i + 30));
        }

        const courses = [];
        for (const chunk of courseChunks) {
            const snapshot = await db.collection("courses")
                .where("__name__", "in", chunk)
                .get();
            snapshot.forEach(doc => {
                courses.push({ id: doc.id, ...doc.data() });
            });
        }

        // For each course, fetch its assignments to calculate grade stats
        const result = [];
        for (const course of courses) {
            const assignmentsSnapshot = await db.collection("assignments")
                .where("courseId", "==", course.id)
                .get();

            const assignments = [];
            assignmentsSnapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });

            // Count how many assignments are completed by this student
            const completedAssignments = studentData.completedAssignments || [];
            const totalAssignments = assignments.length;
            const completedCount = assignments.filter(a =>
                completedAssignments.includes(a.id)
            ).length;

            // Calculate a simple completion percentage as "grade"
            const completionPercent = totalAssignments > 0
                ? Math.round((completedCount / totalAssignments) * 100)
                : 0;

            result.push({
                id: course.id,
                code: course.code || "N/A",
                name: course.name || "",
                totalAssignments,
                completedCount,
                completionPercent,
                // Expose the raw grade field if it exists on the course (for future use)
                grade: course.grades ? course.grades[uid] ?? null : null
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching student courses for graph:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};