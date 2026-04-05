const { db } = require("../database/firebase");

// GET /api/grades/admin-overview/all
// Returns all courses and all students with their per-course weighted grade.
// Same structure as the teacher-overview response so the frontend can reuse
// the same renderGroupedBarChart() function.
exports.getAllCoursesGradesForAdmin = async (req, res) => {
    try {
        // 1. Fetch ALL courses
        const coursesSnapshot = await db.collection("courses").get();
        const courses = [];
        coursesSnapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });

        if (courses.length === 0) {
            return res.status(200).json({ courses: [], students: [] });
        }

        // 2. Collect all unique student IDs across every course
        const allStudentIdSet = new Set();
        courses.forEach(course => {
            (course.studentIds || []).forEach(sid => allStudentIdSet.add(sid));
        });

        const allStudentIds = Array.from(allStudentIdSet);

        if (allStudentIds.length === 0) {
            return res.status(200).json({ courses: [], students: [] });
        }

        // 3. Fetch all student documents in chunks of 30
        const studentChunks = [];
        for (let i = 0; i < allStudentIds.length; i += 30) {
            studentChunks.push(allStudentIds.slice(i, i + 30));
        }

        const studentMap = {}; // { uid: { uid, name } }
        for (const chunk of studentChunks) {
            const snapshot = await db.collection("students")
                .where("uid", "in", chunk)
                .get();
            snapshot.forEach(doc => {
                const data = doc.data();
                studentMap[data.uid] = {
                    uid: data.uid,
                    name: `${data.fname} ${data.lname}`
                };
            });
        }

        // 4. For each course, fetch assignments and compute each student's weighted grade
        const gradesByCourse = {}; // { courseId: { studentUid: gradeOrNull } }

        for (const course of courses) {
            gradesByCourse[course.id] = {};

            const assignmentsSnapshot = await db.collection("assignments")
                .where("courseId", "==", course.id)
                .get();

            const assignments = [];
            assignmentsSnapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });

            (course.studentIds || []).forEach(studentUid => {
                let weightedSum = 0;
                let totalWeight = 0;

                assignments.forEach(a => {
                    const weight = parseFloat(String(a.weight).replace("%", "")) || 0;
                    const grades = a.grades || {};
                    if (grades[studentUid] !== undefined) {
                        weightedSum += weight * grades[studentUid];
                        totalWeight += weight;
                    }
                });

                gradesByCourse[course.id][studentUid] = totalWeight > 0
                    ? Math.round(weightedSum / totalWeight)
                    : null;
            });
        }

        // 5. Build response — same shape as teacher-overview so the frontend
        //    can call the exact same renderGroupedBarChart() function
        const studentsResult = allStudentIds
            .filter(uid => studentMap[uid])
            .map(uid => ({
                uid,
                name: studentMap[uid].name,
                grades: Object.fromEntries(
                    courses.map(c => [c.id, gradesByCourse[c.id][uid] ?? null])
                )
            }));

        res.status(200).json({
            courses: courses.map(c => ({ id: c.id, code: c.code, name: c.name })),
            students: studentsResult
        });

    } catch (error) {
        console.error("Error fetching admin graph data:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};