const express = require("express");
const router = express.Router();

// Import your auth middleware
const { verifyToken } = require("../middleware/authMiddleware");

// Import the new controller functions
const {
    studentGetController,
    studentGetAllController,
    studentCreateController,
    studentUpdateController,
    studentDeleteController,
    studentGetByIdController
} = require("../controller/studentController");

router.get("/getstudent", verifyToken, studentGetController);
router.get("/getallstudents", verifyToken,studentGetAllController);
router.post("/newstudent" ,verifyToken,studentCreateController);
router.put("/updatestudent", verifyToken,studentUpdateController);
router.delete("/deletestudent",verifyToken, studentDeleteController);
router.get("/:id", studentGetByIdController);

module.exports = router;
