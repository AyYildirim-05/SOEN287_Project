const { auth, db } = require("../database/firebase");

async function signUpController(req, res) {
    const { email, password, fname, lname, role, studentID, major } = req.body;
    
    // Basic validation
    if (!email || !password || !fname || !lname || !role) {
        return res.status(400).json({ message: "All fields are required (email, password, fname, lname, role)" });
    }
   
    try {
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${fname} ${lname}`
        });

        // Define the base user data
        const userData = {
            uid: userRecord.uid,
            email,
            fname,
            lname,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add role-specific fields (Student)
        if (role === "student") {
            userData.studentID = studentID || null;
            userData.major = major || null;
            userData.enrolledCourses = [];
            userData.gpa = 0.0;
        }

        // Store in Firestore 'users' collection
        await db.collection("users").doc(userRecord.uid).set(userData);

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

    console.log("--- DEBUG: Sign-In Request Received ---");
    console.log("Email from frontend:", email);
    console.log("Password from frontend:", password ? "[PROVIDED]" : "[MISSING]");

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

        // 2. Fetch the user's detailed profile from Firestore
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            // This might happen if a user exists in Auth but not in Firestore
            return res.status(404).json({ message: "User profile not found in database." });
        }

        const userData = userDoc.data();

        // 3. Return user profile and token to frontend
        res.status(200).json({ 
            message: "Sign-in successful",
            user: userData,
            token: idToken // The frontend can store this in localStorage/sessionStorage
        });

    } catch (error) {
        console.error("Error during sign-in:", error.message);
        res.status(500).json({ message: "Internal server error during sign-in." });
    }
}

module.exports = { signUpController, signInController };