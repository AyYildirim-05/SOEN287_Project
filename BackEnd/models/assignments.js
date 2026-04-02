class Assignment {
    constructor(data) {
        this.id = data.id | null; // firebase document id
        this.courseId = data.courseId; // document id
        this.teacherId = data.teacherId; // UID of teacher who created it 
        this.title = data.title;
        this.description = data.description || " ";
        this.dueDate = data.dueDate ? new Date(data.dueDate) : new Date();
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    toFirestore() {
        return {
            courseId: this.courseId,
            teacherId: this.teacherId,
            title: this.title,
            description: this.description,
            dueDate: this.dueDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = { Assignment };
