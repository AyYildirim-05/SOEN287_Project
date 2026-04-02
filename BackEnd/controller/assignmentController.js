const { db } = require("../database/firebase");
const admin = require("firebase-admin");
const Assignment = require("../models/assignments");

// add new assignments
exports.addAssignment = async (req, res) => {
    try {
        //to confirm what dueDate looks like
        console.log("Assignment body:", req.body);

        const { courseId, teacherId, title, description, dueDate } = req.body;
        
        const newAssignment = new Assignment({
            courseId, teacherId, title, description, dueDate
        }).toFirestore();

        const docRef = await db.collection("assignments").add(newAssignment);
        res.status(201).json({ id: docRef.id, ...newAssignment});
    } catch (error) {
        console.error("Error adding assignment:", error);
        res.status(500).json({ message: "Internal server error."});
    }
};

// get assignments for a specific course
exports.getAssignmentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await db.collection("assignments").where("courseId", "==", courseId).get();

        const assignments = [];
        snapshot.forEach(doc => {
            assignments.push({ id: doc.id, ...doc.data()});
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
        const studentRef = db.collection("student").doc(studentId);

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