class Admin {
    constructor(data) {
        this.uid = data.uid;
        this.email = data.email;
        this.fname = data.fname;
        this.lname = data.lname;
        this.role = "admin";
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
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Admin;
