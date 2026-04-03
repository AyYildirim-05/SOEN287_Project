class Major {
    constructor(data) {
        this.majorName = data.majorName;
        this.description = data.description || "";
    }

    toFirestore() {
        return {
            majorName: this.majorName,
            description: this.description 
        };
    }
}

module.exports = Major;