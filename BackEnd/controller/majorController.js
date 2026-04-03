const { db } = require("../database/firebase");

// Add a new major
exports.addMajor = async (req, res) => {
    if (!db) {
        return res.status(500).json({ message: "Database not initialized." });
    }
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Major name is required." });
        }

        const newMajor = {
            name,
            description: description || "",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection("majors").add(newMajor);
        res.status(201).json({ id: docRef.id, ...newMajor });
    } catch (error) {
        console.error("Error adding major:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get all majors
exports.getAllMajors = async (req, res) => {
    try {
        const snapshot = await db.collection("majors").get();
        const majors = [];
        snapshot.forEach(doc => {
            majors.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(majors);
    } catch (error) {
        console.error("Error getting majors:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get students and teachers by major
exports.getByMajor = async (req, res) => {
    try {
        const { majorName } = req.params;
        
        const studentsSnapshot = await db.collection("students").where("major", "==", majorName).get();
        const teachersSnapshot = await db.collection("teachers").where("major", "==", majorName).get();
        
        const students = [];
        studentsSnapshot.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
        
        const teachers = [];
        teachersSnapshot.forEach(doc => teachers.push({ id: doc.id, ...doc.data() }));
        
        res.status(200).json({ students, teachers });
    } catch (error) {
        console.error("Error getting people by major:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
