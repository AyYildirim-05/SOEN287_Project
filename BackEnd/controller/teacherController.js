const { db, auth } = require("../database/firebase");

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

// Get the currently authenticated teacher
exports.getTeacherController = async (req, res) => {
    try {
        const uid = req.user.uid;
        const docRef = db.collection("teachers").doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Teacher not found." });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching teacher:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Update the currently authenticated teacher
exports.updateTeacherController = async (req, res) => {
    try {
        const uid = req.user.uid;
        const updateData = { ...req.body };
        
        // Handle password update separately via Firebase Auth
        if (updateData.password) {
            await auth.updateUser(uid, { password: updateData.password });
            delete updateData.password; // Don't store plaintext password in Firestore
        }

        // Update name in Firebase Auth if provided
        if (updateData.fname || updateData.lname) {
            const currentDoc = await db.collection("teachers").doc(uid).get();
            const currentData = currentDoc.data();
            const fname = updateData.fname || currentData.fname;
            const lname = updateData.lname || currentData.lname;
            await auth.updateUser(uid, { displayName: `${fname} ${lname}` });
        }

        // Update the timestamp
        updateData.updatedAt = new Date();

        const docRef = db.collection("teachers").doc(uid);
        await docRef.update(updateData);

        res.status(200).json({ message: "Teacher profile updated successfully." });
    } catch (error) {
        console.error("Error updating teacher:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
