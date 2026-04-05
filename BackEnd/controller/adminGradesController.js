const { db } = require("../database/firebase");

// Main Page graph — all courses, all students, same aesthetic as teacher-overview.
exports.getAllCoursesGradesForAdmin = async (req, res) => {
    try {
        // Gets all courses available
        const coursesSnapshot = await db.collection("courses").get();
        const courses = [];
        coursesSnapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });

        if (courses.length === 0) {
            return res.status(200).json({ courses: [], students: [] });
        }

        // Gets all students available
        const allStudentIdSet = new Set();
        courses.forEach(course => {
            (course.studentIds || []).forEach(sid => allStudentIdSet.add(sid));
        });

        const allStudentIds = Array.from(allStudentIdSet);

        if (allStudentIds.length === 0) {
            return res.status(200).json({ courses: [], students: [] });
        }

        const studentChunks = [];
        for (let i = 0; i < allStudentIds.length; i += 30) {
            studentChunks.push(allStudentIds.slice(i, i + 30));
        }

        const studentMap = {}; // {uid : {fname, lastname}} because we will be using the uid to display the first name and last name n the x-aixs
        for (const chunk of studentChunks) {
            const snapshot = await db.collection("students")
                .where("uid", "in", chunk)
                .get();
            snapshot.forEach(doc => {
                const data = doc.data();
                studentMap[data.uid] = { uid: data.uid, name: `${data.fname} ${data.lname}` };
            });
        }

        
        const gradesByCourse = {};
        for (const course of courses) {
            gradesByCourse[course.id] = {}; // Creates a new object with the key being the course id

            // Gets all assignments for the course
            const assignmentsSnapshot = await db.collection("assignments")
                .where("courseId", "==", course.id)
                .get();

            const assignments = [];
            assignmentsSnapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });

            // Math to calculate average
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

        const studentsResult = allStudentIds
            .filter(uid => studentMap[uid]) // Filters out any non-existing ids
            .map(uid => ({
                uid,
                name: studentMap[uid].name,
                grades: Object.fromEntries(
                    courses.map(c => [c.id, gradesByCourse[c.id][uid] ?? null]) // From the map, we get the grade for this student, if it doesn't exist, we set it to null
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

// Individual Course Page graph — all students in the course, same aesthetic as teacher-overview.
// Same logic as teacherGradesController
exports.getCourseGradesForAdmin = async (req, res) => {
    try {
        const { courseId } = req.params;

        const courseDoc = await db.collection("courses").doc(courseId).get();
        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        const courseData = courseDoc.data();
        const studentIds = courseData.studentIds || [];

        if (studentIds.length === 0) {
            return res.status(200).json({
                course: { id: courseId, code: courseData.code, name: courseData.name },
                students: []
            });
        }

        const assignmentsSnapshot = await db.collection("assignments")
            .where("courseId", "==", courseId)
            .get();

        const assignments = [];
        assignmentsSnapshot.forEach(doc => {
            assignments.push({ id: doc.id, ...doc.data() });
        });

        const studentChunks = [];
        for (let i = 0; i < studentIds.length; i += 30) {
            studentChunks.push(studentIds.slice(i, i + 30));
        }

        const studentMap = {};
        for (const chunk of studentChunks) {
            const snapshot = await db.collection("students")
                .where("uid", "in", chunk)
                .get();
            snapshot.forEach(doc => {
                const data = doc.data();
                studentMap[data.uid] = { uid: data.uid, name: `${data.fname} ${data.lname}` };
            });
        }

        const students = studentIds
            .filter(uid => studentMap[uid])
            .map(uid => {
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

                return {
                    uid,
                    name: studentMap[uid].name,
                    courseGrade: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
                };
            });

        res.status(200).json({
            course: { id: courseId, code: courseData.code, name: courseData.name },
            students
        });

    } catch (error) {
        console.error("Error fetching course grades:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};