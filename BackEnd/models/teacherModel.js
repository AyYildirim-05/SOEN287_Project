/**
 * This is a reference for the User data structure in Firestore.
 * Firestore is schema-less, so this is enforced at the application level.
 */

const teacherSchema = {
    uid: String,            // From Firebase Auth (Not Null)
    email: String,          // From Firebase Auth (Not Null)
    fname: String,          // First Name (Not Null)
    lname: String,          // Last Name (Not Null)
    role: "teacher",           // User Role e.g., "student", "admin" (Not Null)
    
    // Optional / Nullable fields depending on role
    teachertID: String,      // e.g., "40123456"
    major: String,          // e.g., "Software Engineering"
    teachingClasses: Array, // Array of document IDs from 'courses' collection
    createdAt: Date,
    updatedAt: Date
};

module.exports = { teacherSchema };
