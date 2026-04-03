const express = require("express");
const router = express.Router();
const majorController = require("../controller/majorController");

router.post("/add", majorController.addMajor);
router.get("/", majorController.getAllMajors);
router.get("/:majorName/people", majorController.getByMajor);

module.exports = router;
