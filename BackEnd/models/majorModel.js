class Major {
    constructor(data) {
        this.majorName = data.majorName;
    }

    toFirestore() {
        return {
            majorName: this.majorName
        };
    }
}

module.exports = Major;