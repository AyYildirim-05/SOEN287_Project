
class Teacher {
    constructor(data) {
        this.uid = data.uid;
        this.email = data.email;
        this.fname = data.fname;
        this.lname = data.lname;
        this.role = "teacher";
        this.teacherID = data.teacherID || data.teachertID || ""; // Fixed typo from teachertID
        this.major = data.major || "";
        this.teachingClasses = data.teachingClasses || [];
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
            teacherID: this.teacherID,
            major: this.major,
            teachingClasses: this.teachingClasses,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Teacher;
