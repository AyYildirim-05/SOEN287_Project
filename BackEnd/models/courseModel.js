class Course {
    constructor(data) {
        this.uid = data.uid;
        this.classId = data.classId;
        this.major = data.major;
        this.courseName = data.courseName;
        this.teacherId = data.teacherId;
        this.studentIds = data.studentIds || [];
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.assignments = data.assignments || [];
        this.isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
    }
    
    toFirestore() {
        return {
            uid: this.uid,
            classId: this.classId,
            major: this.major,
            courseName: this.courseName,
            teacherId: this.teacherId,
            studentIds: this.studentIds,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            assignments: this.assignments,
            isEnabled: this.isEnabled
        };
    }
}

module.exports = { courseSchema };
