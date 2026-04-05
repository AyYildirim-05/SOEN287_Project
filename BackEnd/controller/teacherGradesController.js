const { db } = require("../database/firebase");

// Get all students across all courses a teacher is teaching with their averages
exports.getTeacherCoursesForGraph = async (req, res) => {
    try {
        const uid = req.user.uid; 

        // Gets all courses a teacher is teaching
        const teacherDoc = await db.collection("teachers").doc(uid).get();
        if (!teacherDoc.exists) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        const teacherData = teacherDoc.data();
        const teachingClassIds = teacherData.teachingClasses || [];

        if (teachingClassIds.length === 0) {
            return res.status(200).json({ courses: [], students: [] });
        }

        // Gets all course documents (we use chunks of 30s because of firestore's special quirk with how they store things)
        const courseChunks = [];
        for (let i = 0; i < teachingClassIds.length; i += 30) {
            courseChunks.push(teachingClassIds.slice(i, i + 30));
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

        // Gets all stuedent IDS in all courses of the teacher. A set is used to avoid duplicate students
        const allStudentIdSet = new Set();
        courses.forEach(course => {
            (course.studentIds || []).forEach(sid => allStudentIdSet.add(sid));
        });

        const allStudentIds = Array.from(allStudentIdSet); // Transforms back to array for easier handling

        if (allStudentIds.length === 0) {
            return res.status(200).json({ courses: [], students: [] });
        }

        // Gets all student documents
        const studentChunks = [];
        for (let i = 0; i < allStudentIds.length; i += 30) {
            studentChunks.push(allStudentIds.slice(i, i + 30));
        }

        const studentMap = {}; // { uid: { fname, lname } }, we use this format because on the x-axis, we'll say first and last name of each students
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

        // For each course, get assignment grades and do the math to find average
        // Result shape: { courseId: { studentUid: grade } }
        const gradesByCourse = {};

        for (const course of courses) {
            gradesByCourse[course.id] = {};

            const assignmentsSnapshot = await db.collection("assignments")
                .where("courseId", "==", course.id)
                .get();

            const assignments = [];
            assignmentsSnapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });

            // For each student enrolled in this course, calculate their weighted grade
            (course.studentIds || []).forEach(studentUid => {
                let weightedSum = 0;
                let totalWeight = 0;

                assignments.forEach(a => {
                    const weight = parseFloat(String(a.weight).replace("%", "")) || 0; // Converting weight (string) into a number
                    const grades = a.grades || {};
                    if (grades[studentUid] !== undefined) {
                        weightedSum += weight * grades[studentUid]; // Imagine this is the numerator
                        totalWeight += weight; // Imagine this is the denominator
                    }
                });

                // null = student has no grades entered yet
                gradesByCourse[course.id][studentUid] = totalWeight > 0
                    ? Math.round(weightedSum / totalWeight)
                    : null;
            });
        }

        // Data gets transfered to front end
        // courses: [{ id, code, name }]
        // students: [{ uid, name, grades: { courseId: gradeOrNull } }]
        const studentsResult = allStudentIds
            .filter(uid => studentMap[uid]) // skip any UIDs not found in DB
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
        console.error("Error fetching teacher graph data:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};