const { db } = require("../database/firebase");
const admin = require("firebase-admin");
const Assignment = require("../models/assignments");

// add new assignments
exports.addAssignment = async (req, res) => {
    try {
        //to confirm what dueDate looks like
        console.log("Assignment body:", req.body);

        const { courseId, teacherId, title, weight, description, dueDate } = req.body;
        
        const newAssignment = new Assignment({
            courseId, teacherId, title, weight, description, dueDate
        }).toFirestore();

        const docRef = await db.collection("assignments").add(newAssignment);
        res.status(201).json({ id: docRef.id, ...newAssignment});
    } catch (error) {
        console.error("Error adding assignment:", error);
        res.status(500).json({ message: "Internal server error."});
    }
};

// helper function to safely parse dates 
const formatTimestamp = (field) => {
    if (!field) return null;

    // 1. If it's a standard Firebase Timestamp class
    if (typeof field.toDate === 'function') {
        return field.toDate().toISOString();
    }

    // 2. If Firebase returned a raw object (stripped of prototype)
    if (field._seconds !== undefined) {
        return new Date(field._seconds * 1000).toISOString();
    }
    
    // 3. If it's already a JS Date object
    if (field instanceof Date) {
        return field.toISOString();
    }

    // 4. If it was saved as a plain string (e.g., "Mar 30, 2026")
    const parsedDate = new Date(field);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
    }

    return field; // Fallback
}

// get assignments for a specific course
exports.getAssignmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection("assignments").where("courseId", "==", courseId).get();

        const assignments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            
            assignments.push({ 
                id: doc.id,
                ...data,
                dueDate: formatTimestamp(data.dueDate),
                createdAt: formatTimestamp(data.createdAt),
                updatedAt: formatTimestamp(data.updatedAt)
            });
        });

        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ message: "Internal server error."});
    }
};

// toggle assignment completion for students
exports.toggleCompletion = async (req, res) => {
    try {
        const { studentId, assignmentId, isCompleted} = req.body;
        const studentRef = db.collection("students").doc(studentId);

        if (isCompleted) {
            // add to the completed assignments array
            await studentRef.update({
                completedAssignments: admin.firestore.FieldValue.arrayUnion(assignmentId)
            });
        } else {
            // remove from the completed assignments array
            await studentRef.update({
                completedAssignments: admin.firestore.FieldValue.arrayRemove(assignmentId)
            });
        }
        res.status(200).json({message: "Status updated successfully."})
    } catch (error) {
        console.error("Error updating completion status", error);
        res.status(500).json({message: "Internal server error."});
    }
} 

// get all assignments
exports.getAllAssignments = async (req, res) => {
    try {
        const snapshot = await db.collection("assignments").get();
        const assignments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            
            assignments.push({ 
                id: doc.id, 
                ...data,
                dueDate: formatTimestamp(data.dueDate),
                createdAt: formatTimestamp(data.createdAt),
                updatedAt: formatTimestamp(data.updatedAt)
            });
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching all assignments", error);
        res.status(500).json({ message: "Internal server error."});
    }
}