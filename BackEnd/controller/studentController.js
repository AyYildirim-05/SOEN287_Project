const { db, auth } = require("../database/firebase");
const Student = require("../models/studentSchema");

// Get the currently authenticated student
exports.studentGetController = async (req, res) => {
    try {
        const uid = req.user.uid; // Provided by authMiddleware
        const docRef = db.collection("students").doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching student:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get all students
exports.studentGetAllController = async (req, res) => {
    try {
        const snapshot = await db.collection("students").get();
        const students = [];
        
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(students);
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Create a new student profile
exports.studentCreateController = async (req, res) => {
    try {
        // Use the authenticated user's UID as the document ID
        const uid = req.user ? req.user.uid : req.body.uid; 
        
        if (!uid) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const studentData = req.body;
        
        // Use the schema class you provided to format the data
        const newStudent = new Student({ ...studentData, uid }).toFirestore();

        // Save to Firestore using the UID as the document ID
        await db.collection("students").doc(uid).set(newStudent);
        
        res.status(201).json({ id: uid, ...newStudent });
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Update the currently authenticated student
exports.studentUpdateController = async (req, res) => {
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
            const currentDoc = await db.collection("students").doc(uid).get();
            const currentData = currentDoc.data();
            const fname = updateData.fname || currentData.fname;
            const lname = updateData.lname || currentData.lname;
            await auth.updateUser(uid, { displayName: `${fname} ${lname}` });
        }

        // Update the timestamp
        updateData.updatedAt = new Date();

        const docRef = db.collection("students").doc(uid);
        await docRef.update(updateData);

        res.status(200).json({ message: "Student profile updated successfully." });
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Delete the currently authenticated student profile
exports.studentDeleteController = async (req, res) => {
    try {
        const uid = req.user.uid;
        
        await db.collection("students").doc(uid).delete();
        
        res.status(200).json({ message: "Student profile deleted successfully." });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get a specific student by their document ID
exports.studentGetByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = db.collection("students").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Student not found." });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error("Error fetching student by ID:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};