const { db } = require("../database/firebase");

// Main Page Graph for Students
// Dashboard graph: one bar per enrolled course, showing weighted average
exports.getStudentCoursesForGraph = async (req, res) => {
    try {
        const uid = req.user.uid;

        const studentDoc = await db.collection("students").doc(uid).get();
        if (!studentDoc.exists) {
            return res.status(404).json({ message: "Student not found." });
        }

        const studentData = studentDoc.data();
        const enrolledCourseIds = studentData.enrolledCourses || [];

        if (enrolledCourseIds.length === 0) {
            return res.status(200).json([]);
        }

        // Fetch courses in chunks of 30 (Firestore "in" limit)
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
            let weightedSum = 0;
            let totalWeight = 0;

            assignments.forEach(a => {
                const weight = parseFloat(String(a.weight).replace("%", "")) || 0;
                const grades = a.grades || {};
                if (grades[uid] !== undefined) {
                    weightedSum += weight * grades[uid];
                    totalWeight += weight;
                }
            });

            const courseGrade = totalWeight > 0
                ? Math.round(weightedSum / totalWeight)
                : null;

            result.push({
                id: course.id,
                code: course.code || "N/A",
                name: course.name || "",
                totalAssignments,
                courseGrade
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching student courses for graph:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Individual Course Page Graph for Students
// Course page graph: one bar per assignment in this course, showing the student's grade on each
exports.getStudentAssignmentsForGraph = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { courseId } = req.params;

        const assignmentsSnapshot = await db.collection("assignments")
            .where("courseId", "==", courseId)
            .get();

        const assignments = [];
        assignmentsSnapshot.forEach(doc => {
            const data = doc.data();
            const grades = data.grades || {};
            assignments.push({
                id: doc.id,
                title: data.title || "Untitled",
                weight: data.weight || "0",
                grade: grades[uid] !== undefined ? grades[uid] : null // student's entered grade
            });
        });

        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching student assignments for graph:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};