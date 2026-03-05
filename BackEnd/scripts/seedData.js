const { db } = require("../database/firebase");
const { v4: uuidv4 } = require('uuid'); 

async function seedStudent() {
    if (!db) {
        console.error("Firestore is not initialized. Please check your .env and serviceAccountKey.json.");
        return;
    }

    const sampleStudent = {
        uid: uuidv4(), // Generate a unique ID for the student
        email: "jane.doe@mail.concordia.ca",
        fname: "Jane",
        lname: "Doe",
        role: "student",
        studentID: null,
        major: null,
        enrolledCourses: ["SOEN287", "COMP248"],
        gpa: 3.8,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        console.log("Attempting to add sample student...");
        await db.collection("users").doc(sampleStudent.uid).set(sampleStudent);
        console.log("Successfully added sample student to Firestore!");
        process.exit(0);
    } catch (error) {
        console.error("Error adding student:", error.message);
        process.exit(1);
    }
}

seedStudent();
