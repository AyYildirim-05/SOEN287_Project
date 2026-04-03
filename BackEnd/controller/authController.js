const { auth, db } = require("../database/firebase");
const Student = require("../models/studentSchema");
const Teacher = require("../models/teacherModel");
const Admin = require("../models/adminSchema");

async function signUpController(req, res) {
    const { email, password, fname, lname, role, major, studentID, teacherID } = req.body;
    
    // Basic validation
    if (!email || !password || !fname || !lname || !role) {
        return res.status(400).json({ message: "All fields are required (email, password, fname, lname, role)" });
    }

    if (role !== "admin" && !major) {
        return res.status(400).json({ message: "Major is required for students and teachers" });
    }

    if (role === "student" && !studentID) {
        return res.status(400).json({ message: "Student ID is required" });
    }

    if (role === "teacher" && !teacherID) {
        return res.status(400).json({ message: "Teacher ID is required" });
    }

    if (!email.includes("@") || !email.includes(".")) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    try {
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${fname} ${lname}`
        });

        let userData;
        let collectionName;

        // Use the scheme of the respective class
        if (role === "student") {
            const student = new Student({ uid: userRecord.uid, email, fname, lname, studentID, major });
            userData = student.toFirestore();
            collectionName = "students";
        } else if (role === "teacher") {
            const teacher = new Teacher({ uid: userRecord.uid, email, fname, lname, teacherID, major });
            userData = teacher.toFirestore();
            collectionName = "teachers";
        } else if (role === "admin") {
            const admin = new Admin({ uid: userRecord.uid, email, fname, lname });
            userData = admin.toFirestore();
            collectionName = "admins";
        } else {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        // Store in role-specific collection
        await db.collection(collectionName).doc(userRecord.uid).set(userData);

        res.status(201).json({ 
            message: "User created successfully", 
            uid: userRecord.uid,
            role: role
        });
    } catch (error) {
        console.error("Error signing up:", error.message);
        res.status(500).json({ message: "Error during sign-up: " + error.message });
    }
}

async function signInController(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: "Backend error: FIREBASE_WEB_API_KEY is not configured." });
    }

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    try {
        // 1. Verify credentials via Firebase Auth REST API
        const response = await fetch(signInUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(401).json({ 
                message: "Authentication failed", 
                error: data.error?.message || "Invalid credentials" 
            });
        }

        const uid = data.localId;
        const idToken = data.idToken;

        // 2. Fetch the user's detailed profile from the role-specific collections
        // Since we don't know the role, we search in each collection
        let userDoc = await db.collection("students").doc(uid).get();
        
        if (!userDoc.exists) {
            userDoc = await db.collection("teachers").doc(uid).get();
        }
        
        if (!userDoc.exists) {
            userDoc = await db.collection("admins").doc(uid).get();
        }

        if (!userDoc.exists) {
            return res.status(404).json({ message: "User profile not found in database." });
        }

        const userData = userDoc.data();

        // 3. Return user profile and token to frontend
        res.status(200).json({ 
            message: "Sign-in successful",
            user: userData,
            token: idToken 
        });

    } catch (error) {
        console.error("Error during sign-in:", error.message);
        res.status(500).json({ message: "Internal server error during sign-in." });
    }
}

module.exports = { signUpController, signInController };
