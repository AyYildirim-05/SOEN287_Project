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
        // Firestore "in" queries support up to 30 items, so we chunk them in case we have more than 30
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

        // 3. For each course, calculate the student's weighted grade
        const result = [];
        for (const course of courses) {
            const assignmentsSnapshot = await db.collection("assignments")
                .where("courseId", "==", course.id)
                .get();

            const assignments = [];
            assignmentsSnapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });

            const totalAssignments = assignments.length;
            let weightedSum = 0; // sum of (weight * enteredGrade)
            let totalWeight = 0; // sum of weights for graded assignments only

            assignments.forEach(a => {
                // Strip "%" if stored as "25%", then convert to number
                const weight = parseFloat(String(a.weight).replace("%", "")) || 0;

                // Only include assignments where the student has entered a grade
                const grades = a.grades || {};
                if (grades[uid] !== undefined) {
                    weightedSum += weight * grades[uid];
                    totalWeight += weight;
                }
            });

            // Formula: sum(weight * enteredGrade) / sum(weights of graded assignments)
            // e.g. (30*75 + 15*100 + 50*56 + 5*82) / (30+15+50+5) = 6960/100 = 69.6 -> 70%
            // null means no grades have been entered yet
            const courseGrade = totalWeight > 0
                ? Math.round(weightedSum / totalWeight)
                : null;

            result.push({
                id: course.id,
                code: course.code || "N/A",
                name: course.name || "",
                totalAssignments,
                courseGrade // e.g. 70, or null if no grades entered yet
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching student courses for graph:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};