

const courseSchema = {
    uid: String,            // From Firebase Auth
    classId: String,      // e.g., "40123456"
    major: String,          // e.g., "Software Engineering"
    courseName: String,     // e.g., "SOEN 287"
    teacherId: String,      // Document ID of the teacher in 'teachers' collection
    studentIds: Array,     // Array of document IDs of students enrolled in this course
    createdAt: Date,
    updatedAt: Date,
    assignments: Array,     // Array of assignment objects { title: String, description: String, dueDate: Date }
};

module.exports = { courseSchema };
