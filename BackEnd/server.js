require("dotenv").config({ path: "./BackEnd/.env" });
const { auth, db } = require("./database/firebase");

const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");  
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static("FrontEnd"));

// Test route
app.use("/api", testRoutes);
app.use("/api/auth", authRoutes); // Use auth routes
app.use("/api/courses", courseRoutes); // Use course routes
app.use("/api/assignments", assignmentRoutes); // Use assignment routes
app.use("/api/student", studentRoutes);

// Port
const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

