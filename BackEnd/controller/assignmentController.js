const { db } = require("../database/firebase");
const admin = require("firebase-admin");
const Assignment = require("../models/assignments");

// Add new assignment
exports.addAssignment = async (req, res) => {
    try {
        console.log("Assignment body:", req.body);
        const { courseId, teacherId, title, weight, description, dueDate } = req.body;
        
        const newAssignment = new Assignment({
            courseId, teacherId, title, weight, description, dueDate
        }).toFirestore();

        const docRef = await db.collection("assignments").add(newAssignment);
        res.status(201).json({ id: docRef.id, ...newAssignment });
    } catch (error) {
        console.error("Error adding assignment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Helper function to safely parse dates
const formatTimestamp = (field) => {
    if (!field) return null; 
    if (typeof field.toDate === 'function') return field.toDate().toISOString(); // 1. If it's a standard Firebase Timestamp class
    if (field._seconds !== undefined) return new Date(field._seconds * 1000).toISOString(); // 2. If Firebase returned a raw object (stripped of prototype)
    if (field instanceof Date) return field.toISOString(); // 3. If it's already a JS Date object
    const parsedDate = new Date(field); // 4. If it was saved as a plain string (e.g., "Mar 30, 2026")
    if (!isNaN(parsedDate.getTime())) return parsedDate.toISOString();
    return field;
};

// Get assignments for a specific course
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
        res.status(500).json({ message: "Internal server error." });
    }
};

// Toggle assignment completion for students
exports.toggleCompletion = async (req, res) => {
    try {
        const { studentId, assignmentId, isCompleted } = req.body;
        const studentRef = db.collection("students").doc(studentId);

        if (isCompleted) {
            await studentRef.update({  // add to the completed assignments array
                completedAssignments: admin.firestore.FieldValue.arrayUnion(assignmentId)
            });
        } else {
            await studentRef.update({ // remove from the completed assignments array
                completedAssignments: admin.firestore.FieldValue.arrayRemove(assignmentId)
            });
        }
        res.status(200).json({ message: "Status updated successfully." });
    } catch (error) {
        console.error("Error updating completion status", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Get all assignments
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
        res.status(500).json({ message: "Internal server error." });
    }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = db.collection("assignments").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        await docRef.delete(); // delete the document from firebase
        res.status(200).json({ message: "Assignment deleted successfully." });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Students updating their grades
exports.gradeAssignment = async (req, res) => {
    try {
        // Gets the student ID of the logged in user
        const studentId = req.user.uid;
        const { assignmentId, score } = req.body;

        // Error Handling
        if (!assignmentId || score === undefined) {
            return res.status(400).json({ message: "assignmentId and score are required." });
        }

        if (score < 0 || score > 100) {
            return res.status(400).json({ message: "Score must be between 0 and 100." });
        }

        // Gets the assignment id from db
        const assignmentRef = db.collection("assignments").doc(assignmentId);
        const assignmentDoc = await assignmentRef.get();

        if (!assignmentDoc.exists) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        // Updates the map in the assignment collection in db
        await assignmentRef.update({
            [`grades.${studentId}`]: score
        });

        res.status(200).json({ message: "Grade saved successfully." });
    } catch (error) {
        console.error("Error saving grade:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Edit an assignment (teacher)
exports.editAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, dueDate, weight, description } = req.body;

        const docRef = db.collection("assignments").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        const updates = { updatedAt: new Date() };
        if (title !== undefined) {
            updates.title = title;
        }      
        if (weight !== undefined) {
            updates.weight = weight;
        }    
        if (description !== undefined) {
            updates.description = description;
        }
        if (dueDate !== undefined) {
            const parsed = new Date(dueDate);
            updates.dueDate = isNaN(parsed.getTime()) ? new Date() : parsed;
        }

        await docRef.update(updates);
        res.status(200).json({ message: "Assignment updated successfully." });
    } catch (error) {
        console.error("Error editing assignment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};