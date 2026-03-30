
class Student {
    constructor(data) {
        this.uid = data.uid;
        this.email = data.email;
        this.fname = data.fname;
        this.lname = data.lname;
        this.role = "student";
        this.studentID = data.studentID || "";
        this.major = data.major || "";
        this.enrolledCourses = data.enrolledCourses || [];
        this.gpa = data.gpa || 0.0;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    toFirestore() {
        return {
            uid: this.uid,
            email: this.email,
            fname: this.fname,
            lname: this.lname,
            role: this.role,
            studentID: this.studentID,
            major: this.major,
            enrolledCourses: this.enrolledCourses,
            gpa: this.gpa,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Student;
