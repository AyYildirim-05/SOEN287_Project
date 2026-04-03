const { db } = require("../database/firebase");

// Get all teachers
exports.getAllTeachers = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const snapshot = await db.collection("teachers").get();
        const teachers = [];
        snapshot.forEach(doc => {
            teachers.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(teachers);
    } catch (error) {
        console.error("Error getting teachers:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get a teacher by ID
exports.getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection("teachers").doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: "Teacher not found." });
        }
        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error getting teacher:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
