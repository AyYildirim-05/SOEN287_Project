const { db, admin } = require("../database/firebase");

//Create template
function buildCourseTemplate(templateName, code, name) {
    switch ((templateName || "").toLowerCase()) {
        case "programming":
            return {
                description: `Welcome to ${code} - ${name}. This course includes programming assignments and project-based work.`,
                tas: [],
                announcements: [
                    {
                        title: "Welcome",
                        description: "Welcome to the course. Please review the syllabus and schedule."
                    },
                    {
                        title: "Getting Started",
                        description: "Make sure you have access to the course materials and required software."
                    }
                ],
                assignments: []
            };

        case "theory":
            return {
                description: `Welcome to ${code} - ${name}. This course focuses on theoretical concepts, readings, and evaluations.`,
                tas: [],
                announcements: [
                    {
                        title: "Welcome",
                        description: "Welcome to the course. Please read the outline carefully."
                    }
                ],
                assignments: []
            };

        case "lab":
            return {
                description: `Welcome to ${code} - ${name}. This course includes lab work and practical exercises.`,
                tas: [],
                announcements: [
                    {
                        title: "Lab Preparation",
                        description: "Please bring your materials and review the lab instructions before each session."
                    }
                ],
                assignments: []
            };

        default:
            return {
                description: "",
                tas: [],
                announcements: [],
                assignments: []
            };
    }
}

// Update course info
exports.updateCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }

    try {
        const { id } = req.params;
        const {
            code,
            name,
            description,
            credits,
            section,
            instructor,
            schedule,
            tas
        } = req.body;

        const courseRef = db.collection("courses").doc(id);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        const existingCourse = courseDoc.data();

        const updatedFields = {
            updatedAt: new Date()
        };

        if (code !== undefined) updatedFields.code = String(code).trim().toUpperCase();
        if (name !== undefined) updatedFields.name = String(name).trim();
        if (description !== undefined) updatedFields.description = String(description).trim();
        if (credits !== undefined) updatedFields.credits = String(credits).trim();
        if (section !== undefined) updatedFields.section = String(section).trim();
        if (instructor !== undefined) updatedFields.instructor = String(instructor).trim();
        if (schedule !== undefined) updatedFields.schedule = String(schedule).trim();
        if (tas !== undefined) updatedFields.tas = Array.isArray(tas) ? tas : [];

        const finalCode = updatedFields.code ?? existingCourse.code;
        const finalName = updatedFields.name ?? existingCourse.name;

        if (!finalCode || !finalName) {
            return res.status(400).json({ message: "Course code and name are required." });
        }

        await courseRef.update(updatedFields);

        const updatedDoc = await courseRef.get();
        res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Add a new course
exports.addCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }

    try {
        const {
            code,
            name,
            description,
            credits,
            section,
            instructor,
            schedule,
            teacherId,
            template
        } = req.body;

        // Start with submitted values
        let finalCode = code ? code.trim() : "";
        let finalName = name ? name.trim() : "";
        let finalCredits = credits ? String(credits).trim() : "";
        let finalSection = section ? section.trim() : "";
        let finalInstructor = instructor ? instructor.trim() : "";
        let finalSchedule = schedule ? schedule.trim() : "";

        // Fill defaults if a template was selected
        if (template === "programming") {
            finalCode = finalCode || "SOEN287";
            finalName = finalName || "Web Programming";
            finalCredits = finalCredits || "3";
            finalSection = finalSection || "AA";
            finalSchedule = finalSchedule || "Monday 10:15 - 12:45";
        } else if (template === "theory") {
            finalCode = finalCode || "COMP232";
            finalName = finalName || "Mathematics for Computer Science";
            finalCredits = finalCredits || "3";
            finalSection = finalSection || "AA";
            finalSchedule = finalSchedule || "Tuesday 14:00 - 16:30";
        } else if (template === "lab") {
            finalCode = finalCode || "SOEN228";
            finalName = finalName || "System Hardware";
            finalCredits = finalCredits || "3";
            finalSection = finalSection || "AB";
            finalSchedule = finalSchedule || "Wednesday 13:15 - 15:45";
        }

        // Validate after template defaults are applied
        if (!finalCode || !finalName) {
            return res.status(400).json({ message: "Course code and name are required." });
        }

        const templateData = buildCourseTemplate(template, finalCode.toUpperCase(), finalName);

        const newCourse = {
            code: finalCode.toUpperCase(),
            name: finalName,
            description: description || templateData.description || "",
            credits: finalCredits || "",
            section: finalSection || "",
            instructor: finalInstructor || "",
            schedule: finalSchedule || "",
            teacherId: teacherId || "",
            studentIds: [],
            tas: templateData.tas || [],
            assignments: templateData.assignments || [],
            announcements: templateData.announcements || [],
            template: template || "",
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection("courses").add(newCourse);
        const courseId = docRef.id;

        // Add course to teacher's teachingClasses
        if (teacherId) {
            const teacherRef = db.collection("teachers").doc(teacherId);
            const teacherDoc = await teacherRef.get();
            if (teacherDoc.exists) {
                await teacherRef.update({
                    teachingClasses: admin.firestore.FieldValue.arrayUnion(courseId)
                });
            }
        }

        res.status(201).json({ id: courseId, ...newCourse });
    } catch (error) {
        console.error("Error adding course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const snapshot = await db.collection("courses").get();
        const courses = [];
        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error getting courses:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const { id } = req.params;
        const courseRef = db.collection("courses").doc(id);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        const { teacherId, studentIds } = courseDoc.data();

        // Remove from teacher
        if (teacherId) {
            await db.collection("teachers").doc(teacherId).update({
                teachingClasses: admin.firestore.FieldValue.arrayRemove(id)
            });
        }

        // Remove from all enrolled students
        if (studentIds && studentIds.length > 0) {
            const batch = db.batch();
            studentIds.forEach(sid => {
                const studentRef = db.collection("students").doc(sid);
                batch.update(studentRef, {
                    enrolledCourses: admin.firestore.FieldValue.arrayRemove(id)
                });
            });
            await batch.commit();
        }

        await courseRef.delete();
        res.status(200).json({ message: "Course deleted successfully." });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Enroll a student in a course
exports.enrollInCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const { courseId, studentId } = req.body;

        if (!courseId || !studentId) {
            return res.status(400).json({ message: "Course ID and Student ID are required." });
        }

        // Check if course is enabled
        const courseDoc = await db.collection("courses").doc(courseId).get();
        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }
        if (courseDoc.data().isEnabled === false) {
            return res.status(403).json({ message: "This course is currently disabled for registration." });
        }

        // Update course
        await db.collection("courses").doc(courseId).update({
            studentIds: admin.firestore.FieldValue.arrayUnion(studentId)
        });

        // Update student
        await db.collection("students").doc(studentId).update({
            enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId)
        });

        res.status(200).json({ message: "Enrolled successfully." });
    } catch (error) {
        console.error("Error enrolling in course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Toggle course enabled/disabled status
exports.updateCourseStatus = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }

    try {
        const { id } = req.params;
        const { isEnabled } = req.body;

        if (typeof isEnabled !== "boolean") {
            return res.status(400).json({ message: "isEnabled must be a boolean." });
        }

        const courseRef = db.collection("courses").doc(id);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        await courseRef.update({
            isEnabled,
            updatedAt: new Date()
        });

        res.status(200).json({ message: `Course ${isEnabled ? 'enabled' : 'disabled'} successfully.` });
    } catch (error) {
        console.error("Error updating course status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Unenroll a student from a course
exports.unenrollFromCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const { courseId, studentId } = req.body;

        if (!courseId || !studentId) {
            return res.status(400).json({ message: "Course ID and Student ID are required." });
        }

        // Update course
        await db.collection("courses").doc(courseId).update({
            studentIds: admin.firestore.FieldValue.arrayRemove(studentId)
        });

        // Update student
        await db.collection("students").doc(studentId).update({
            enrolledCourses: admin.firestore.FieldValue.arrayRemove(courseId)
        });

        res.status(200).json({ message: "Unenrolled successfully." });
    } catch (error) {
        console.error("Error unenrolling from course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Remove teacher from a course
exports.removeTeacherFromCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const { courseId, teacherId } = req.body;

        if (!courseId || !teacherId) {
            return res.status(400).json({ message: "Course ID and Teacher ID are required." });
        }

        // Update course - set teacherId to empty string and instructor name to empty
        await db.collection("courses").doc(courseId).update({
            teacherId: "",
            instructor: ""
        });

        // Update teacher
        await db.collection("teachers").doc(teacherId).update({
            teachingClasses: admin.firestore.FieldValue.arrayRemove(courseId)
        });

        res.status(200).json({ message: "Teacher removed from course successfully." });
    } catch (error) {
        console.error("Error removing teacher from course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.getCourseById = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }

    try {
        const { id } = req.params;
        const doc = await db.collection("courses").doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error getting course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get students and teacher for a specific course
exports.getPeopleInCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const courseDoc = await db.collection("courses").doc(id).get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        const courseData = courseDoc.data();
        const studentIds = courseData.studentIds || [];
        const teacherId = courseData.teacherId;

        const students = [];
        if (studentIds.length > 0) {
            const studentSnapshots = await db.collection("students").where("uid", "in", studentIds.slice(0, 30)).get();
            studentSnapshots.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
        }

        let teacher = null;
        if (teacherId) {
            const teacherDoc = await db.collection("teachers").doc(teacherId).get();
            if (teacherDoc.exists) {
                teacher = { id: teacherDoc.id, ...teacherDoc.data() };
            }
        }

        res.status(200).json({ students, teacher });
    } catch (error) {
        console.error("Error getting people in course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Save announcements
exports.updateAnnouncements = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }

    try {
        const { id } = req.params;
        const { announcements } = req.body;

        if (!Array.isArray(announcements)) {
            return res.status(400).json({ message: "Announcements must be an array." });
        }

        const courseRef = db.collection("courses").doc(id);
        const courseDoc = await courseRef.get();

        if (!courseDoc.exists) {
            return res.status(404).json({ message: "Course not found." });
        }

        await courseRef.update({
            announcements,
            updatedAt: new Date()
        });

        const updatedDoc = await courseRef.get();
        res.status(200).json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error("Error updating announcements:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
