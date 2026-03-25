
const adminSchema = {
    uid: String,            // From Firebase Auth
    email: String,          // From Firebase Auth
    firstName: String,
    lastName: String,
    role: "admin",          // Hardcoded for this role
    createdAt: Date,
    updatedAt: Date
};