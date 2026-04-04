class Assignment {
    constructor(data) {
        this.id = data.id || null; // firebase document id
        this.courseId = data.courseId; // document id
        this.teacherId = data.teacherId; // UID of teacher who created it 
        this.title = data.title;
        this.weight = data.weight || "";
        this.description = data.description || " ";
        
        const parsedDueDate = data.dueDate ? new Date(data.dueDate) : new Date();
        this.dueDate = isNaN(parsedDueDate.getTime()) ? new Date() : parsedDueDate;
        
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.grades = data.grades || {};
    }

    toFirestore() {
        return {
            courseId: this.courseId,
            teacherId: this.teacherId,
            title: this.title,
            weight: this.weight,
            description: this.description,
            dueDate: this.dueDate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            grades: this.grades
        };
    }
}

module.exports = Assignment;
