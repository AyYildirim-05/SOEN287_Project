const { db } = require("../database/firebase");

// Add a new course
exports.addCourse = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const { code, name, credits, section, instructor, schedule, teacherId } = req.body;

        if (!code || !name) {
            return res.status(400).json({ message: "Course code and name are required." });
        }

        const newCourse = {
            code: code.toUpperCase(),
            name,
            credits: credits || "",
            section: section || "",
            instructor: instructor || "",
            schedule: schedule || "",
            teacherId: teacherId || "",
            studentIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection("courses").add(newCourse);
        res.status(201).json({ id: docRef.id, ...newCourse });
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
        await db.collection("courses").doc(id).delete();
        res.status(200).json({ message: "Course deleted successfully." });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
