require("dotenv").config();
require("./database/db");

const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static("FrontEnd"));

// Test route
app.use("/api", testRoutes);

// Port
const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

