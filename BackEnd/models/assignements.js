
const assignmentSchema = {
    uid: String,            // From Firebase Auth
    courseId: String,       // Document ID of the course in 'courses' collection
    title: String,          // Title of the assignment
    description: String,    // Description of the assignment
    dueDate: Date,         // Due date for the assignment
    createdAt: Date,
    updatedAt: Date
    
};

module.exports = { assignmentSchema };
