/**
 * This is a reference for the Student data structure in Firestore.
 * Firestore is schema-less, so this is enforced at the application level.
 */

const studentSchema = {
    uid: String,            // From Firebase Auth
    email: String,          // From Firebase Auth
    firstName: String,
    lastName: String,
    role: "student",        // Hardcoded for this role
    studentID: String,      // e.g., "40123456"
    major: String,          // e.g., "Software Engineering"
    enrolledCourses: Array, // Array of document IDs from 'courses' collection
    gpa: Number,
    createdAt: Date,
    updatedAt: Date
};

module.exports = { studentSchema };
