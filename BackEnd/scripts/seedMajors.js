const { db } = require("../database/firebase");

async function seedMajors() {
    if (!db) {
        console.error("Firestore is not initialized.");
        return;
    }

    const majors = [
        { name: "Software Engineering", description: "Learn to build software systems." },
        { name: "Computer Engineering", description: "Focus on hardware and software." },
        { name: "Computer Science", description: "Deep dive into algorithms and theory." },
        { name: "Mechanical Engineering", description: "Design and build mechanical systems." },
        { name: "Electrical Engineering", description: "Work with electricity and systems." }
    ];

    try {
        console.log("Seeding majors...");
        for (const major of majors) {
            const snapshot = await db.collection("majors").where("name", "==", major.name).get();
            if (snapshot.empty) {
                await db.collection("majors").add({
                    ...major,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`Added major: ${major.name}`);
            } else {
                console.log(`Major already exists: ${major.name}`);
            }
        }
        console.log("Seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding majors:", error);
        process.exit(1);
    }
}

seedMajors();
